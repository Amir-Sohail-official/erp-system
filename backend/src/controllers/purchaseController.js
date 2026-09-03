import mongoose from 'mongoose';

import Product from '../models/Product.js';
import Purchase from '../models/Purchase.js';
import PurchaseItem from '../models/PurchaseItem.js';
import Supplier from '../models/Supplier.js';
import InventoryTransaction from '../models/InventoryTransaction.js';
import inventoryService from '../services/inventoryService.js';
import { errorResponse, successResponse } from '../utils/apiResponse.js';

const generatePurchaseNumber = async () => {
  const lastPurchase = await Purchase.findOne({}).sort({ createdAt: -1 }).lean();
  const nextSequence = lastPurchase ? Number(String(lastPurchase.purchaseNumber).split('-')[1] || 0) + 1 : 1;
  return `PUR-${String(nextSequence).padStart(6, '0')}`;
};

const calculateLineTotal = ({ quantity, costPrice, discount = 0, tax = 0 }) => {
  const normalizedQuantity = Number(quantity || 0);
  const normalizedCost = Number(costPrice || 0);
  const normalizedDiscount = Number(discount || 0);
  const normalizedTax = Number(tax || 0);
  return normalizedQuantity * normalizedCost - normalizedDiscount + normalizedTax;
};

const resolvePaymentStatus = (totalAmount, paidAmount) => {
  if (paidAmount <= 0) return 'UNPAID';
  if (paidAmount >= totalAmount) return 'PAID';
  return 'PARTIAL';
};

export const listPurchases = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const supplierId = req.query.supplier || '';
    const paymentStatus = req.query.paymentStatus || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const query = {};
    if (search) {
      query.$or = [
        { purchaseNumber: { $regex: search, $options: 'i' } },
      ];
    }
    if (supplierId && supplierId !== 'all') {
      query.supplier = supplierId;
    }
    if (paymentStatus && paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus;
    }

    const [purchases, total] = await Promise.all([
      Purchase.find(query)
        .populate('supplier', 'name email phone')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Purchase.countDocuments(query),
    ]);

    return res.status(200).json(successResponse({
      items: purchases,
      pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
    }, 'Purchases fetched successfully'));
  } catch (error) {
    return next(error);
  }
};

export const getPurchaseById = async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('supplier', 'name email phone')
      .populate({ path: 'items', populate: { path: 'product', select: 'name sku' } })
      .lean();

    if (!purchase) {
      return res.status(404).json(errorResponse('Purchase not found', ['Purchase does not exist']));
    }

    return res.status(200).json(successResponse(purchase, 'Purchase fetched successfully'));
  } catch (error) {
    return next(error);
  }
};

export const createPurchase = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const { supplierId, items: requestItems, paidAmount: requestedPaidAmount = 0 } = req.body;

    const supplier = await Supplier.findById(supplierId).session(session);
    if (!supplier) {
      return res.status(400).json(errorResponse('Supplier not found', ['The selected supplier does not exist']));
    }

    if (!Array.isArray(requestItems) || requestItems.length === 0) {
      return res.status(400).json(errorResponse('Purchase items required', ['At least one item is required']));
    }

    const itemPayloads = [];
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    for (const item of requestItems) {
      const product = await Product.findById(item.productId).session(session);
      if (!product) {
        return res.status(400).json(errorResponse('Invalid product', [`Product ${item.productId} does not exist`]))
      }

      const quantity = Number(item.quantity || 0);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return res.status(400).json(errorResponse('Invalid quantity', [`Quantity for ${product.name} must be greater than 0`]));
      }

      const costPrice = Number(product.costPrice || 0);
      const itemDiscount = Number(item.discount || 0);
      const itemTax = Number(item.tax || 0);
      const itemLineTotal = calculateLineTotal({ quantity, costPrice, discount: itemDiscount, tax: itemTax });

      subtotal += quantity * costPrice;
      discountTotal += itemDiscount;
      taxTotal += itemTax;

      itemPayloads.push({
        productId: product._id,
        product,
        quantity,
        costPrice,
        discount: itemDiscount,
        tax: itemTax,
        total: itemLineTotal,
      });
    }

    const totalAmount = subtotal - discountTotal + taxTotal;
    const paidAmount = Number(requestedPaidAmount || 0);
    const remainingAmount = Math.max(totalAmount - paidAmount, 0);
    const paymentStatus = resolvePaymentStatus(totalAmount, paidAmount);

    let purchase;
    await session.withTransaction(async () => {
      const purchaseNumber = await generatePurchaseNumber();

      purchase = await Purchase.create([{
        supplier: supplier._id,
        purchaseNumber,
        subtotal,
        discount: discountTotal,
        tax: taxTotal,
        totalAmount,
        paidAmount,
        remainingAmount,
        paymentStatus,
        status: 'COMPLETED',
        createdBy: req.user._id,
      }], { session });

      const purchaseRecord = purchase[0];
      const createdItems = [];

      for (const entry of itemPayloads) {
        const purchaseItem = await PurchaseItem.create([{
          purchase: purchaseRecord._id,
          product: entry.productId,
          quantity: entry.quantity,
          costPrice: entry.costPrice,
          discount: entry.discount,
          tax: entry.tax,
          total: entry.total,
        }], { session });
        createdItems.push(purchaseItem[0]._id);

        await inventoryService.increaseStock({
          productId: entry.productId,
          quantity: entry.quantity,
          reason: `Purchase ${purchaseNumber}`,
          referenceType: 'PURCHASE',
          referenceId: purchaseRecord._id.toString(),
          createdBy: req.user._id,
          type: 'PURCHASE',
          session,
        });
      }

      purchaseRecord.items = createdItems;
      await purchaseRecord.save({ session });
    });

    const populatedPurchase = await Purchase.findById(purchase[0]._id)
      .populate('supplier', 'name email phone')
      .populate({ path: 'items', populate: { path: 'product', select: 'name sku' } })
      .lean();

    return res.status(201).json(successResponse(populatedPurchase, 'Purchase created successfully'));
  } catch (error) {
    return next(error);
  } finally {
    await session.endSession();
  }
};

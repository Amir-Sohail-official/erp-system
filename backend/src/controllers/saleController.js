import mongoose from 'mongoose';

import Customer from '../models/Customer.js';
import InventoryTransaction from '../models/InventoryTransaction.js';
import Payment from '../models/Payment.js';
import Product from '../models/Product.js';
import Sale from '../models/Sale.js';
import SaleItem from '../models/SaleItem.js';
import inventoryService from '../services/inventoryService.js';
import { errorResponse, successResponse } from '../utils/apiResponse.js';

const generateInvoiceNumber = async () => {
  const lastSale = await Sale.findOne({}).sort({ createdAt: -1 }).lean();
  const nextSequence = lastSale ? Number(String(lastSale.invoiceNumber).split('-')[1] || 0) + 1 : 1;
  return `INV-${String(nextSequence).padStart(6, '0')}`;
};

const calculateLineTotal = ({ quantity, sellingPrice, discount = 0, tax = 0 }) => {
  const normalizedQuantity = Number(quantity || 0);
  const normalizedPrice = Number(sellingPrice || 0);
  const normalizedDiscount = Number(discount || 0);
  const normalizedTax = Number(tax || 0);
  return normalizedQuantity * normalizedPrice - normalizedDiscount + normalizedTax;
};

const resolvePaymentStatus = (totalAmount, paidAmount) => {
  if (paidAmount <= 0) return 'UNPAID';
  if (paidAmount >= totalAmount) return 'PAID';
  return 'PARTIAL';
};

export const listSales = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const customerId = req.query.customer || '';
    const paymentStatus = req.query.paymentStatus || '';
    const fromDate = req.query.fromDate || '';
    const toDate = req.query.toDate || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const query = {};
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
      ];
    }

    if (customerId && customerId !== 'all') {
      query.customer = customerId;
    }

    if (paymentStatus && paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus;
    }

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    const [sales, total] = await Promise.all([
      Sale.find(query)
        .populate('customer', 'name email phone')
        .populate('createdBy', 'name email')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Sale.countDocuments(query),
    ]);

    return res.status(200).json(successResponse({
      items: sales,
      pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
    }, 'Sales fetched successfully'));
  } catch (error) {
    return next(error);
  }
};

export const getSaleById = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('createdBy', 'name email')
      .populate({ path: 'items', populate: { path: 'product', select: 'name sku' } })
      .lean();

    if (!sale) {
      return res.status(404).json(errorResponse('Sale not found', ['Sale does not exist']));
    }

    const payment = await Payment.findOne({ sale: sale._id }).populate('createdBy', 'name email').lean();

    return res.status(200).json(successResponse({
      ...sale,
      payment,
      receipt: {
        companyName: 'ERP System',
        invoiceNumber: sale.invoiceNumber,
        date: sale.createdAt,
        customer: sale.customer?.name || 'Walk-in Customer',
        items: sale.items || [],
        subtotal: sale.subtotal,
        discount: sale.discount,
        tax: sale.tax,
        total: sale.totalAmount,
        paid: sale.paidAmount,
        remaining: sale.remainingAmount,
        paymentMethod: sale.paymentMethod,
      },
    }, 'Sale fetched successfully'));
  } catch (error) {
    return next(error);
  }
};

export const createSale = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const {
      customerId,
      items: requestItems,
      paidAmount: requestedPaidAmount = 0,
      paymentMethod = 'CASH',
      discount: requestDiscount = 0,
      tax: requestTax = 0,
    } = req.body;

    if (!Array.isArray(requestItems) || requestItems.length === 0) {
      return res.status(400).json(errorResponse('Sale items required', ['At least one item is required']));
    }

    let customer = null;
    if (customerId) {
      customer = await Customer.findById(customerId).session(session);
      if (!customer) {
        return res.status(400).json(errorResponse('Customer not found', ['The selected customer does not exist']));
      }
    }

    const normalizedDiscount = Number(requestDiscount || 0);
    const normalizedTax = Number(requestTax || 0);
    const itemPayloads = [];
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    for (const item of requestItems) {
      const product = await Product.findById(item.productId).session(session);
      if (!product) {
        return res.status(400).json(errorResponse('Invalid product', [`Product ${item.productId} does not exist`]));
      }

      const quantity = Number(item.quantity || 0);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return res.status(400).json(errorResponse('Invalid quantity', [`Quantity for ${product.name} must be greater than 0`]));
      }

      if (Number(product.stock ?? 0) < quantity) {
        return res.status(400).json(errorResponse('Insufficient stock', [`Insufficient stock for ${product.name}.`]));
      }

      const sellingPrice = Number(product.sellingPrice || 0);
      const itemDiscount = Number(item.discount || 0);
      const itemTax = Number(item.tax || 0);
      const itemTotal = calculateLineTotal({ quantity, sellingPrice, discount: itemDiscount, tax: itemTax });

      subtotal += quantity * sellingPrice;
      discountTotal += itemDiscount;
      taxTotal += itemTax;

      itemPayloads.push({
        productId: product._id,
        product,
        quantity,
        sellingPrice,
        discount: itemDiscount,
        tax: itemTax,
        total: itemTotal,
      });
    }

    const totalAmount = subtotal - discountTotal + taxTotal + normalizedDiscount + normalizedTax;
    const paidAmount = Number(requestedPaidAmount || 0);
    const remainingAmount = Math.max(totalAmount - paidAmount, 0);
    const paymentStatus = resolvePaymentStatus(totalAmount, paidAmount);

    let sale;
    await session.withTransaction(async () => {
      const invoiceNumber = await generateInvoiceNumber();

      sale = await Sale.create([{
        customer: customer ? customer._id : null,
        invoiceNumber,
        subtotal,
        discount: discountTotal + normalizedDiscount,
        tax: taxTotal + normalizedTax,
        totalAmount,
        paidAmount,
        remainingAmount,
        paymentMethod,
        paymentStatus,
        status: 'COMPLETED',
        createdBy: req.user._id,
      }], { session });

      const saleRecord = sale[0];
      const createdItems = [];

      for (const entry of itemPayloads) {
        const saleItem = await SaleItem.create([{
          sale: saleRecord._id,
          product: entry.productId,
          quantity: entry.quantity,
          sellingPrice: entry.sellingPrice,
          discount: entry.discount,
          tax: entry.tax,
          total: entry.total,
        }], { session });

        createdItems.push(saleItem[0]._id);

        await inventoryService.decreaseStock({
          productId: entry.productId,
          quantity: entry.quantity,
          reason: `Sale ${invoiceNumber}`,
          referenceType: 'SALE',
          referenceId: saleRecord._id.toString(),
          createdBy: req.user._id,
          type: 'SALE',
          session,
        });
      }

      await Payment.create([{
        sale: saleRecord._id,
        amount: paidAmount,
        method: paymentMethod,
        status: paymentStatus,
        referenceType: 'SALE',
        referenceId: saleRecord._id.toString(),
        createdBy: req.user._id,
      }], { session });

      saleRecord.items = createdItems;
      await saleRecord.save({ session });
    });

    const populatedSale = await Sale.findById(sale[0]._id)
      .populate('customer', 'name email phone')
      .populate('createdBy', 'name email')
      .populate({ path: 'items', populate: { path: 'product', select: 'name sku' } })
      .lean();

    const receipt = {
      companyName: 'ERP System',
      invoiceNumber: populatedSale.invoiceNumber,
      date: populatedSale.createdAt,
      customer: populatedSale.customer?.name || 'Walk-in Customer',
      items: populatedSale.items || [],
      subtotal: populatedSale.subtotal,
      discount: populatedSale.discount,
      tax: populatedSale.tax,
      total: populatedSale.totalAmount,
      paid: populatedSale.paidAmount,
      remaining: populatedSale.remainingAmount,
      paymentMethod: populatedSale.paymentMethod,
    };

    return res.status(201).json(successResponse({
      ...populatedSale,
      receipt,
    }, 'Sale created successfully'));
  } catch (error) {
    return next(error);
  } finally {
    await session.endSession();
  }
};

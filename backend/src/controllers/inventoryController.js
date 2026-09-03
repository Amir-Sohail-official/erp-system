import Product from '../models/Product.js';
import InventoryTransaction from '../models/InventoryTransaction.js';
import inventoryService from '../services/inventoryService.js';
import { errorResponse, successResponse } from '../utils/apiResponse.js';

const buildInventoryStatus = (product) => {
  const currentStock = Number(product.stock ?? 0);
  const minimumStock = Number(product.minimumStock ?? 0);
  const isLowStock = currentStock <= minimumStock;

  let stockStatus = 'Healthy';
  if (isLowStock) {
    stockStatus = currentStock === 0 ? 'Out of stock' : 'Low stock';
  } else if (currentStock > minimumStock) {
    stockStatus = 'Healthy';
  }

  return {
    ...product,
    currentStock,
    minimumStock,
    isLowStock,
    stockStatus,
  };
};

export const listInventory = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const category = req.query.category || '';

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    const [items, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name isActive')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      Product.countDocuments(query),
    ]);

    const transformed = items.map((product) => buildInventoryStatus(product));
    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return res.status(200).json(successResponse({
      items: transformed,
      pagination: { page, limit, total, totalPages },
    }, 'Inventory fetched successfully'));
  } catch (error) {
    return next(error);
  }
};

export const getInventoryByProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId).populate('category', 'name isActive').lean();
    if (!product) {
      return res.status(404).json(errorResponse('Product not found', ['Product does not exist']));
    }

    return res.status(200).json(successResponse(buildInventoryStatus(product), 'Inventory fetched successfully'));
  } catch (error) {
    return next(error);
  }
};

export const getInventoryHistory = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json(errorResponse('Product not found', ['Product does not exist']));
    }

    const history = await InventoryTransaction.find({ product: product._id })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(successResponse(history, 'Inventory history fetched successfully'));
  } catch (error) {
    return next(error);
  }
};

export const adjustInventory = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const adjustment = req.body.adjustment ?? req.body.quantity;
    const reason = req.body.reason;

    if (adjustment === undefined || adjustment === null || adjustment === '') {
      return res.status(400).json(errorResponse('Adjustment required', ['An adjustment value is required']));
    }

    if (!reason || !String(reason).trim()) {
      return res.status(400).json(errorResponse('Reason required', ['Every stock change requires a reason']));
    }

    const { product, transaction } = await inventoryService.adjustStock({
      productId,
      adjustment,
      reason,
      referenceType: 'MANUAL',
      referenceId: req.body.referenceId || '',
      createdBy: req.user._id,
      type: 'ADJUSTMENT',
    });

    return res.status(200).json(successResponse({
      product,
      transaction,
    }, 'Stock adjusted successfully'));
  } catch (error) {
    return next(error);
  }
};

export const getLowStockProducts = async (req, res, next) => {
  try {
    const products = await Product.find().populate('category', 'name isActive').lean();
    const lowStock = products
      .filter((product) => Number(product.stock ?? 0) <= Number(product.minimumStock ?? 0))
      .map((product) => buildInventoryStatus(product));

    return res.status(200).json(successResponse(lowStock, 'Low stock products fetched successfully'));
  } catch (error) {
    return next(error);
  }
};

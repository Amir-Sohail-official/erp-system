import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { errorResponse, successResponse } from '../utils/apiResponse.js';

const buildProductQuery = (req) => {
  const { search, category, active, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
  const query = {};

  if (search) {
    const searchTerm = search.trim();
    query.$or = [
      { name: { $regex: searchTerm, $options: 'i' } },
      { sku: { $regex: searchTerm, $options: 'i' } },
      { barcode: { $regex: searchTerm, $options: 'i' } },
    ];
  }

  if (category) {
    query.category = category;
  }

  if (active === 'true' || active === 'false') {
    query.isActive = active === 'true';
  }

  return {
    query,
    sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 },
  };
};

export const listProducts = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;
    const { query, sort } = buildProductQuery(req);

    const [items, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name isActive')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return res.status(200).json(successResponse({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }, 'Products fetched successfully'));
  } catch (error) {
    return next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const payload = req.body;

    const category = await Category.findById(payload.category);
    if (!category) {
      return res.status(400).json(errorResponse('Category not found', ['The selected category does not exist']));
    }

    const existingSku = await Product.findOne({ sku: payload.sku.toUpperCase() });
    if (existingSku) {
      return res.status(409).json(errorResponse('SKU already exists', ['A product with this SKU already exists']));
    }

    if (payload.barcode) {
      const duplicateBarcode = await Product.findOne({ barcode: payload.barcode.trim() });
      if (duplicateBarcode) {
        return res.status(409).json(errorResponse('Barcode already exists', ['A product with this barcode already exists']));
      }
    }

    if (payload.costPrice < 0 || payload.sellingPrice < 0) {
      return res.status(400).json(errorResponse('Invalid price', ['Prices must be positive values']));
    }

    if (payload.stock < 0 || payload.minimumStock < 0) {
      return res.status(400).json(errorResponse('Invalid stock', ['Stock values cannot be negative']));
    }

    if (payload.sellingPrice < payload.costPrice) {
      return res.status(400).json(errorResponse('Invalid price', ['Selling price cannot be lower than cost price']));
    }

    const product = await Product.create({
      ...payload,
      sku: payload.sku.toUpperCase(),
      barcode: payload.barcode ? payload.barcode.trim() : '',
      category: payload.category,
      isActive: payload.isActive ?? true,
    });

    const populated = await Product.findById(product._id).populate('category', 'name isActive').lean();
    return res.status(201).json(successResponse(populated, 'Product created successfully'));
  } catch (error) {
    return next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name isActive').lean();

    if (!product) {
      return res.status(404).json(errorResponse('Product not found', ['Product does not exist']));
    }

    return res.status(200).json(successResponse(product, 'Product fetched successfully'));
  } catch (error) {
    return next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json(errorResponse('Product not found', ['Product does not exist']));
    }

    const payload = req.body;

    if (payload.category) {
      const category = await Category.findById(payload.category);
      if (!category) {
        return res.status(400).json(errorResponse('Category not found', ['The selected category does not exist']));
      }
    }

    if (payload.sku && payload.sku.toUpperCase() !== product.sku) {
      const duplicateSku = await Product.findOne({ sku: payload.sku.toUpperCase() });
      if (duplicateSku && duplicateSku._id.toString() !== product._id.toString()) {
        return res.status(409).json(errorResponse('SKU already exists', ['A product with this SKU already exists']));
      }
    }

    if (payload.barcode !== undefined && payload.barcode) {
      const duplicateBarcode = await Product.findOne({ barcode: payload.barcode.trim() });
      if (duplicateBarcode && duplicateBarcode._id.toString() !== product._id.toString()) {
        return res.status(409).json(errorResponse('Barcode already exists', ['A product with this barcode already exists']));
      }
    }

    if (payload.stock !== undefined && payload.stock < 0) {
      return res.status(400).json(errorResponse('Invalid stock', ['Stock cannot be negative']));
    }

    if (payload.minimumStock !== undefined && payload.minimumStock < 0) {
      return res.status(400).json(errorResponse('Invalid stock', ['Minimum stock cannot be negative']));
    }

    const nextCost = payload.costPrice ?? product.costPrice;
    const nextSelling = payload.sellingPrice ?? product.sellingPrice;
    if (nextSelling < nextCost) {
      return res.status(400).json(errorResponse('Invalid price', ['Selling price cannot be lower than cost price']));
    }

    Object.assign(product, {
      ...payload,
      sku: payload.sku ? payload.sku.toUpperCase() : product.sku,
      barcode: payload.barcode === '' ? '' : payload.barcode ? payload.barcode.trim() : product.barcode,
    });

    await product.save();
    const populated = await Product.findById(product._id).populate('category', 'name isActive').lean();
    return res.status(200).json(successResponse(populated, 'Product updated successfully'));
  } catch (error) {
    return next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json(errorResponse('Product not found', ['Product does not exist']));
    }

    await product.deleteOne();
    return res.status(200).json(successResponse(null, 'Product deleted successfully'));
  } catch (error) {
    return next(error);
  }
};

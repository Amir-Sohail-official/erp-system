import Supplier from '../models/Supplier.js';
import { errorResponse, successResponse } from '../utils/apiResponse.js';

const buildSupplierQuery = (req) => {
  const { search, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
  const query = {};

  if (search) {
    const term = search.trim();
    query.$or = [
      { name: { $regex: term, $options: 'i' } },
      { phone: { $regex: term, $options: 'i' } },
      { email: { $regex: term, $options: 'i' } },
    ];
  }

  if (status === 'active' || status === 'inactive') {
    query.isActive = status === 'active';
  }

  return {
    query,
    sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 },
  };
};

export const listSuppliers = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;
    const { query, sort } = buildSupplierQuery(req);

    const [items, total] = await Promise.all([
      Supplier.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Supplier.countDocuments(query),
    ]);

    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return res.status(200).json(successResponse({
      items,
      pagination: { page, limit, total, totalPages },
    }, 'Suppliers fetched successfully'));
  } catch (error) {
    return next(error);
  }
};

export const createSupplier = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      name: req.body.name.trim(),
      email: req.body.email ? req.body.email.trim() : '',
      phone: req.body.phone ? req.body.phone.trim() : '',
      address: req.body.address ? req.body.address.trim() : '',
      city: req.body.city ? req.body.city.trim() : '',
      openingBalance: Number(req.body.openingBalance || 0),
      isActive: req.body.isActive ?? true,
    };

    const supplier = await Supplier.create(payload);
    return res.status(201).json(successResponse(supplier, 'Supplier created successfully'));
  } catch (error) {
    return next(error);
  }
};

export const getSupplierById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json(errorResponse('Supplier not found', ['Supplier does not exist']));
    }

    return res.status(200).json(successResponse(supplier, 'Supplier fetched successfully'));
  } catch (error) {
    return next(error);
  }
};

export const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json(errorResponse('Supplier not found', ['Supplier does not exist']));
    }

    Object.assign(supplier, {
      ...req.body,
      name: req.body.name ? req.body.name.trim() : supplier.name,
      email: req.body.email !== undefined ? (req.body.email ? req.body.email.trim() : '') : supplier.email,
      phone: req.body.phone !== undefined ? (req.body.phone ? req.body.phone.trim() : '') : supplier.phone,
      address: req.body.address !== undefined ? (req.body.address ? req.body.address.trim() : '') : supplier.address,
      city: req.body.city !== undefined ? (req.body.city ? req.body.city.trim() : '') : supplier.city,
      openingBalance: req.body.openingBalance !== undefined ? Number(req.body.openingBalance) : supplier.openingBalance,
      isActive: req.body.isActive ?? supplier.isActive,
    });

    await supplier.save();
    return res.status(200).json(successResponse(supplier, 'Supplier updated successfully'));
  } catch (error) {
    return next(error);
  }
};

export const deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json(errorResponse('Supplier not found', ['Supplier does not exist']));
    }

    await supplier.deleteOne();
    return res.status(200).json(successResponse(null, 'Supplier deleted successfully'));
  } catch (error) {
    return next(error);
  }
};

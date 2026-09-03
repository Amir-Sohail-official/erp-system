import Customer from '../models/Customer.js';
import { errorResponse, successResponse } from '../utils/apiResponse.js';

const buildCustomerQuery = (req) => {
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

export const listCustomers = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;
    const { query, sort } = buildCustomerQuery(req);

    const [items, total] = await Promise.all([
      Customer.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Customer.countDocuments(query),
    ]);

    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return res.status(200).json(successResponse({
      items,
      pagination: { page, limit, total, totalPages },
    }, 'Customers fetched successfully'));
  } catch (error) {
    return next(error);
  }
};

export const createCustomer = async (req, res, next) => {
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

    const customer = await Customer.create(payload);
    return res.status(201).json(successResponse(customer, 'Customer created successfully'));
  } catch (error) {
    return next(error);
  }
};

export const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json(errorResponse('Customer not found', ['Customer does not exist']));
    }

    return res.status(200).json(successResponse(customer, 'Customer fetched successfully'));
  } catch (error) {
    return next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json(errorResponse('Customer not found', ['Customer does not exist']));
    }

    Object.assign(customer, {
      ...req.body,
      name: req.body.name ? req.body.name.trim() : customer.name,
      email: req.body.email !== undefined ? (req.body.email ? req.body.email.trim() : '') : customer.email,
      phone: req.body.phone !== undefined ? (req.body.phone ? req.body.phone.trim() : '') : customer.phone,
      address: req.body.address !== undefined ? (req.body.address ? req.body.address.trim() : '') : customer.address,
      city: req.body.city !== undefined ? (req.body.city ? req.body.city.trim() : '') : customer.city,
      openingBalance: req.body.openingBalance !== undefined ? Number(req.body.openingBalance) : customer.openingBalance,
      isActive: req.body.isActive ?? customer.isActive,
    });

    await customer.save();
    return res.status(200).json(successResponse(customer, 'Customer updated successfully'));
  } catch (error) {
    return next(error);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json(errorResponse('Customer not found', ['Customer does not exist']));
    }

    await customer.deleteOne();
    return res.status(200).json(successResponse(null, 'Customer deleted successfully'));
  } catch (error) {
    return next(error);
  }
};

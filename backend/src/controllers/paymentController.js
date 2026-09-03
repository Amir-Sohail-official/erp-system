import mongoose from 'mongoose';

import Payment from '../models/Payment.js';
import Sale from '../models/Sale.js';
import Purchase from '../models/Purchase.js';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';
import { errorResponse, successResponse } from '../utils/apiResponse.js';

const normalizePaymentMethod = (value) => ['CASH', 'CARD', 'BANK_TRANSFER', 'ONLINE'].includes(value) ? value : 'CASH';
const normalizePaymentType = (value) => ['SALE', 'PURCHASE', 'REFUND'].includes(value) ? value : 'SALE';

export const listPayments = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;
    const method = req.query.method || '';
    const referenceType = req.query.referenceType || '';
    const customer = req.query.customer || '';
    const supplier = req.query.supplier || '';
    const fromDate = req.query.fromDate || '';
    const toDate = req.query.toDate || '';

    const query = {};
    if (method && method !== 'all') query.paymentMethod = method;
    if (referenceType && referenceType !== 'all') query.referenceType = referenceType;
    if (customer && customer !== 'all') query.customer = customer;
    if (supplier && supplier !== 'all') query.supplier = supplier;

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('customer', 'name email phone')
        .populate('supplier', 'name email phone')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(query),
    ]);

    return res.status(200).json(successResponse({
      items: payments,
      pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
    }, 'Payments fetched successfully'));
  } catch (error) {
    return next(error);
  }
};

export const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('supplier', 'name email phone')
      .populate('createdBy', 'name email')
      .lean();

    if (!payment) {
      return res.status(404).json(errorResponse('Payment not found', ['Payment does not exist']));
    }

    return res.status(200).json(successResponse(payment, 'Payment fetched successfully'));
  } catch (error) {
    return next(error);
  }
};

export const createPayment = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const {
      referenceType,
      referenceId,
      customer,
      supplier,
      amount,
      paymentMethod,
      paymentType,
      transactionReference,
      notes,
    } = req.body;

    if (!referenceType || !referenceId) {
      return res.status(400).json(errorResponse('Reference required', ['referenceType and referenceId are required']));
    }

    const normalizedAmount = Number(amount || 0);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return res.status(400).json(errorResponse('Invalid amount', ['Amount must be a positive number']));
    }

    let relatedCustomer = null;
    let relatedSupplier = null;
    if (customer) {
      relatedCustomer = await Customer.findById(customer).session(session);
      if (!relatedCustomer) {
        return res.status(400).json(errorResponse('Customer not found', ['Selected customer does not exist']));
      }
    }

    if (supplier) {
      relatedSupplier = await Supplier.findById(supplier).session(session);
      if (!relatedSupplier) {
        return res.status(400).json(errorResponse('Supplier not found', ['Selected supplier does not exist']));
      }
    }

    let relatedSale = null;
    let relatedPurchase = null;
    if (referenceType === 'SALE') {
      relatedSale = await Sale.findById(referenceId).session(session);
      if (!relatedSale) {
        return res.status(400).json(errorResponse('Sale not found', ['Referenced sale does not exist']));
      }
    } else if (referenceType === 'PURCHASE') {
      relatedPurchase = await Purchase.findById(referenceId).session(session);
      if (!relatedPurchase) {
        return res.status(400).json(errorResponse('Purchase not found', ['Referenced purchase does not exist']));
      }
    }

    let payment;
    await session.withTransaction(async () => {
      payment = await Payment.create([{
        referenceType: normalizePaymentType(referenceType),
        referenceId,
        customer: relatedCustomer ? relatedCustomer._id : null,
        supplier: relatedSupplier ? relatedSupplier._id : null,
        amount: normalizedAmount,
        paymentMethod: normalizePaymentMethod(paymentMethod),
        paymentType: normalizePaymentType(paymentType),
        transactionReference: transactionReference || '',
        notes: notes || '',
        createdBy: req.user._id,
      }], { session });
    });

    return res.status(201).json(successResponse(payment[0], 'Payment recorded successfully'));
  } catch (error) {
    return next(error);
  } finally {
    await session.endSession();
  }
};

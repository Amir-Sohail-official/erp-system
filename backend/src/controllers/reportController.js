import Product from '../models/Product.js';
import Purchase from '../models/Purchase.js';
import Sale from '../models/Sale.js';
import SaleItem from '../models/SaleItem.js';
import PurchaseItem from '../models/PurchaseItem.js';
import { successResponse } from '../utils/apiResponse.js';
import { normalizeReportFilters, calculateGrossProfit } from './dashboardController.js';

export const getSalesReport = async (req, res, next) => {
  try {
    const filters = normalizeReportFilters(req.query);

    const [rows, totals] = await Promise.all([
      Sale.find(filters)
        .populate('customer', 'name email phone')
        .sort({ createdAt: -1 })
        .lean(),
      Sale.aggregate([
        { $match: filters },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, orderCount: { $sum: 1 }, paidValue: { $sum: '$paidAmount' } } },
      ]),
    ]);

    return res.status(200).json(successResponse({
      rows,
      totalRevenue: totals[0]?.totalRevenue ?? 0,
      orderCount: totals[0]?.orderCount ?? 0,
      paidValue: totals[0]?.paidValue ?? 0,
    }, 'Sales report generated successfully'));
  } catch (error) {
    return next(error);
  }
};

export const getPurchasesReport = async (req, res, next) => {
  try {
    const filters = normalizeReportFilters(req.query);

    const [rows, totals] = await Promise.all([
      Purchase.find(filters)
        .populate('supplier', 'name email phone')
        .sort({ createdAt: -1 })
        .lean(),
      Purchase.aggregate([
        { $match: filters },
        { $group: { _id: null, totalPurchases: { $sum: '$totalAmount' }, orderCount: { $sum: 1 }, paidValue: { $sum: '$paidAmount' } } },
      ]),
    ]);

    return res.status(200).json(successResponse({
      rows,
      totalPurchases: totals[0]?.totalPurchases ?? 0,
      orderCount: totals[0]?.orderCount ?? 0,
      paidValue: totals[0]?.paidValue ?? 0,
    }, 'Purchase report generated successfully'));
  } catch (error) {
    return next(error);
  }
};

export const getInventoryReport = async (req, res, next) => {
  try {
    const filters = normalizeReportFilters(req.query);
    const productFilters = { isActive: true };

    if (filters.category) productFilters.category = filters.category;
    if (filters.product) productFilters._id = filters.product;

    const [rows, totals] = await Promise.all([
      Product.find(productFilters).populate('category', 'name').sort({ stock: 1 }).lean(),
      Product.aggregate([
        { $match: productFilters },
        { $group: { _id: null, totalInventoryValue: { $sum: { $multiply: ['$stock', '$costPrice'] } }, lowStockCount: { $sum: { $cond: [{ $lte: ['$stock', '$minimumStock'] }, 1, 0] } }, outOfStockCount: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } } } },
      ]),
    ]);

    return res.status(200).json(successResponse({
      rows,
      totalInventoryValue: totals[0]?.totalInventoryValue ?? 0,
      lowStockCount: totals[0]?.lowStockCount ?? 0,
      outOfStockCount: totals[0]?.outOfStockCount ?? 0,
    }, 'Inventory report generated successfully'));
  } catch (error) {
    return next(error);
  }
};

export const getProfitReport = async (req, res, next) => {
  try {
    const filters = normalizeReportFilters(req.query);

    const sales = await Sale.find(filters).lean();
    const saleIds = sales.map((sale) => sale._id);

    const saleItems = await SaleItem.aggregate([
      { $match: { sale: { $in: saleIds } } },
      { $project: { quantity: 1, sellingPrice: 1, product: 1 } },
    ]);

    const latestPurchaseCostByProduct = await PurchaseItem.aggregate([
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$product', costPrice: { $first: '$costPrice' } } },
    ]);

    const costs = Object.fromEntries(latestPurchaseCostByProduct.map((entry) => [String(entry._id), Number(entry.costPrice || 0)]));
    const grossProfit = calculateGrossProfit(saleItems, costs);

    return res.status(200).json(successResponse({
      grossProfit: Number(grossProfit || 0),
      period: {
        fromDate: req.query.fromDate || null,
        toDate: req.query.toDate || null,
      },
      salesCount: sales.length,
    }, 'Profit report generated successfully'));
  } catch (error) {
    return next(error);
  }
};

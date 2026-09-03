import Product from "../models/Product.js";
import Purchase from "../models/Purchase.js";
import PurchaseItem from "../models/PurchaseItem.js";
import Sale from "../models/Sale.js";
import SaleItem from "../models/SaleItem.js";
import Customer from "../models/Customer.js";
import Supplier from "../models/Supplier.js";
import { successResponse } from "../utils/apiResponse.js";

export const buildDashboardMetrics = (summary = {}) => ({
  totalProducts: Number(summary.totalProducts ?? 0),
  totalCustomers: Number(summary.totalCustomers ?? 0),
  totalSuppliers: Number(summary.totalSuppliers ?? 0),
  todaySales: Number(summary.todaySales ?? 0),
  todayPurchases: Number(summary.todayPurchases ?? 0),
  todayRevenue: Number(summary.todayRevenue ?? 0),
  totalOutstanding: Number(summary.totalOutstanding ?? 0),
  lowStockCount: Number(summary.lowStockCount ?? 0),
});

export const normalizeReportFilters = (query = {}) => {
  const filters = {};

  const fromDate = query.fromDate ? new Date(query.fromDate) : null;
  const toDate = query.toDate ? new Date(query.toDate) : null;

  if (fromDate || toDate) {
    filters.createdAt = {};

    if (fromDate) {
      fromDate.setHours(0, 0, 0, 0);
      filters.createdAt.$gte = fromDate;
    }

    if (toDate) {
      const endOfDay = new Date(toDate);
      endOfDay.setHours(23, 59, 59, 999);
      filters.createdAt.$lte = endOfDay;
    }
  }

  if (query.customer) filters.customer = query.customer;
  if (query.supplier) filters.supplier = query.supplier;
  if (query.product) filters.product = query.product;
  if (query.category) filters.category = query.category;
  if (query.paymentStatus) filters.paymentStatus = query.paymentStatus;

  return filters;
};

export const calculateGrossProfit = (sales, purchaseCostByProduct = {}) => {
  return sales.reduce((profit, item) => {
    const quantity = Number(item.quantity || 0);
    const sellingPrice = Number(item.sellingPrice || 0);
    const productId =
      item.productId || item.product?._id?.toString?.() || item.product || "";
    const costPrice = Number(purchaseCostByProduct[productId] || 0);

    return profit + quantity * sellingPrice - quantity * costPrice;
  }, 0);
};

const getDateBoundaries = () => {
  const start = new Date();
  const end = new Date();

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const getDateBucket = (value) => new Date(value).toISOString().slice(0, 10);

export const getDashboard = async (req, res, next) => {
  try {
    const { start, end } = getDateBoundaries();

    const [
      productCount,
      customerCount,
      supplierCount,
      lowStockProducts,
      salesSummary,
      purchaseSummary,
      outstandingSummary,
      salesByDay,
      salesByMonth,
      topSellingProducts,
      salesByCategory,
      purchaseByDate,
      purchaseBySupplier,
      inventoryValue,
    ] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Customer.countDocuments({ isActive: true }),
      Supplier.countDocuments({ isActive: true }),
      Product.find({ $expr: { $lte: ["$stock", "$minimumStock"] } })
        .select("name stock minimumStock")
        .lean(),
      Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: { $ne: "CANCELLED" },
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$totalAmount" },
            saleCount: { $sum: 1 },
          },
        },
      ]),
      Purchase.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: { $ne: "CANCELLED" },
          },
        },
        {
          $group: {
            _id: null,
            totalPurchases: { $sum: "$totalAmount" },
            purchaseCount: { $sum: 1 },
          },
        },
      ]),
      Sale.aggregate([
        { $match: { status: { $ne: "CANCELLED" } } },
        {
          $group: { _id: null, totalOutstanding: { $sum: "$remainingAmount" } },
        },
      ]),
      Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: { $ne: "CANCELLED" },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            totalSales: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Sale.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().getFullYear(), 0, 1),
              $lte: new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999),
            },
            status: { $ne: "CANCELLED" },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            totalSales: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      SaleItem.aggregate([
        {
          $lookup: {
            from: "products",
            localField: "product",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $group: {
            _id: "$product._id",
            productName: { $first: "$product.name" },
            totalQuantity: { $sum: "$quantity" },
            totalRevenue: { $sum: "$total" },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 5 },
      ]),
      SaleItem.aggregate([
        {
          $lookup: {
            from: "products",
            localField: "product",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $lookup: {
            from: "categories",
            localField: "product.category",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $ifNull: ["$category.name", "Uncategorized"] },
            totalRevenue: { $sum: "$total" },
            totalQuantity: { $sum: "$quantity" },
          },
        },
        { $sort: { totalRevenue: -1 } },
      ]),
      Purchase.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: { $ne: "CANCELLED" },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            totalPurchases: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Purchase.aggregate([
        { $match: { status: { $ne: "CANCELLED" } } },
        {
          $lookup: {
            from: "suppliers",
            localField: "supplier",
            foreignField: "_id",
            as: "supplier",
          },
        },
        { $unwind: "$supplier" },
        {
          $group: {
            _id: "$supplier.name",
            totalPurchases: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { totalPurchases: -1 } },
        { $limit: 10 },
      ]),
      Product.aggregate([
        {
          $group: {
            _id: null,
            totalUnits: { $sum: "$stock" },
            inventoryValue: { $sum: { $multiply: ["$stock", "$costPrice"] } },
          },
        },
      ]),
    ]);

    const latestPurchaseCostByProduct = await PurchaseItem.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$product",
          costPrice: { $first: "$costPrice" },
          quantity: { $first: "$quantity" },
        },
      },
    ]);

    const purchaseCostMap = Object.fromEntries(
      latestPurchaseCostByProduct.map((entry) => [
        String(entry._id),
        Number(entry.costPrice || 0),
      ]),
    );

    const salesRevenueItems = await SaleItem.aggregate([
      {
        $lookup: {
          from: "sales",
          localField: "sale",
          foreignField: "_id",
          as: "sale",
        },
      },
      { $unwind: "$sale" },
      { $match: { "sale.status": { $ne: "CANCELLED" } } },
      { $project: { quantity: 1, sellingPrice: 1, product: 1 } },
    ]);

    const grossProfit = calculateGrossProfit(
      salesRevenueItems,
      purchaseCostMap,
    );

    const dashboardSummary = buildDashboardMetrics({
      totalProducts: productCount,
      totalCustomers: customerCount,
      totalSuppliers: supplierCount,
      todaySales: salesSummary[0]?.totalSales ?? 0,
      todayPurchases: purchaseSummary[0]?.totalPurchases ?? 0,
      todayRevenue: salesSummary[0]?.totalSales ?? 0,
      totalOutstanding: Number(outstandingSummary[0]?.totalOutstanding ?? 0),
      lowStockCount: lowStockProducts.length,
    });

    const inventoryTotals = inventoryValue[0] || {
      totalUnits: 0,
      inventoryValue: 0,
    };
    const outOfStockProducts = await Product.find({ stock: 0, isActive: true })
      .select("name sku stock minimumStock")
      .lean();

    return res.status(200).json(
      successResponse(
        {
          ...dashboardSummary,
          salesByDay,
          salesByMonth,
          topSellingProducts,
          salesByCategory,
          purchaseByDate,
          purchaseBySupplier,
          inventory: {
            totalInventoryItems: productCount,
            lowStockProducts,
            outOfStockProducts,
            inventoryValue: Number(inventoryTotals.inventoryValue ?? 0),
            totalUnits: Number(inventoryTotals.totalUnits ?? 0),
          },
          profit: {
            grossProfit: Number(grossProfit || 0),
            period: { start: getDateBucket(start), end: getDateBucket(end) },
          },
        },
        "Dashboard metrics fetched successfully",
      ),
    );
  } catch (error) {
    return next(error);
  }
};

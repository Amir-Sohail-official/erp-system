import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDashboardMetrics,
  calculateGrossProfit,
  normalizeReportFilters,
} from '../src/controllers/dashboardController.js';

test('normalizeReportFilters converts supported filters to a Mongo-safe query', () => {
  const filters = normalizeReportFilters({
    fromDate: '2024-01-01',
    toDate: '2024-01-31',
    customer: 'cust_123',
    supplier: 'sup_456',
    product: 'prod_789',
    category: 'cat_001',
    paymentStatus: 'PAID',
  });

  assert.equal(filters.createdAt.$gte instanceof Date, true);
  assert.equal(filters.createdAt.$lte instanceof Date, true);
  assert.equal(filters.customer, 'cust_123');
  assert.equal(filters.supplier, 'sup_456');
  assert.equal(filters.product, 'prod_789');
  assert.equal(filters.category, 'cat_001');
  assert.equal(filters.paymentStatus, 'PAID');
});

test('calculateGrossProfit totals revenue minus purchase cost using actual cost data', () => {
  const sales = [
    { quantity: 2, sellingPrice: 100, productId: 'p1' },
    { quantity: 1, sellingPrice: 50, productId: 'p2' },
  ];
  const purchaseCostByProduct = {
    p1: 35,
    p2: 20,
  };

  const grossProfit = calculateGrossProfit(sales, purchaseCostByProduct);
  assert.equal(grossProfit, 160);
});

test('buildDashboardMetrics returns real aggregate values', () => {
  const metrics = buildDashboardMetrics({
    totalProducts: 12,
    totalCustomers: 8,
    totalSuppliers: 4,
    todaySales: 3,
    todayPurchases: 2,
    todayRevenue: 605,
    totalOutstanding: 250,
    lowStockCount: 1,
  });

  assert.equal(metrics.totalProducts, 12);
  assert.equal(metrics.totalCustomers, 8);
  assert.equal(metrics.totalSuppliers, 4);
  assert.equal(metrics.todaySales, 3);
  assert.equal(metrics.todayPurchases, 2);
  assert.equal(metrics.todayRevenue, 605);
  assert.equal(metrics.totalOutstanding, 250);
  assert.equal(metrics.lowStockCount, 1);
});

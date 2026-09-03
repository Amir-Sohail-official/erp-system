import assert from 'node:assert/strict';
import test from 'node:test';

import { createPurchaseReturnTransaction, createSaleReturnTransaction, validateReturnQuantity } from '../src/services/financialService.js';

test('validateReturnQuantity rejects invalid returns beyond original quantity', () => {
  assert.throws(() => validateReturnQuantity({ returnedQuantity: 3, originalQuantity: 2 }), /cannot exceed/i);
});

test('createSaleReturnTransaction calculates refund and stock delta correctly', () => {
  const result = createSaleReturnTransaction({
    originalSaleTotal: 200,
    returnedQuantity: 1,
    originalQuantity: 2,
    unitPrice: 100,
    refundedAmount: 100,
  });

  assert.equal(result.stockDelta, 1);
  assert.equal(result.refundAmount, 100);
  assert.equal(result.returnType, 'SALE_RETURN');
});

test('createPurchaseReturnTransaction calculates reduced stock and refund correctly', () => {
  const result = createPurchaseReturnTransaction({
    originalPurchaseTotal: 500,
    returnedQuantity: 2,
    originalQuantity: 10,
    unitCost: 50,
    refundAmount: 100,
  });

  assert.equal(result.stockDelta, -2);
  assert.equal(result.refundAmount, 100);
  assert.equal(result.returnType, 'PURCHASE_RETURN');
});

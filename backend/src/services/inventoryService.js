import Product from '../models/Product.js';
import InventoryTransaction from '../models/InventoryTransaction.js';

const ensureValidReason = (reason) => {
  const normalized = String(reason || '').trim();
  if (!normalized) {
    throw new Error('A reason is required for every stock change');
  }
  return normalized;
};

const ensurePositiveQuantity = (quantity, fieldName = 'quantity') => {
  const value = Number(quantity);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive number`);
  }
  return value;
};

export const inventoryService = {
  async applyDelta({ productId, delta, reason, referenceType = 'MANUAL', referenceId = '', createdBy, type = 'ADJUSTMENT', session = null }) {
    if (!productId) {
      throw new Error('Product is required');
    }

    const normalizedReason = ensureValidReason(reason);
    const numericDelta = Number(delta);

    if (!Number.isFinite(numericDelta)) {
      throw new Error('Adjustment must be a valid number');
    }

    const product = await Product.findById(productId).session(session);
    if (!product) {
      throw new Error('Product not found');
    }

    const previousStock = Number(product.stock ?? 0);
    const newStock = previousStock + numericDelta;

    if (newStock < 0) {
      throw new Error('Stock cannot become negative');
    }

    product.stock = newStock;
    await product.save({ session });

    const transaction = await InventoryTransaction.create([{ 
      product: product._id,
      type,
      quantity: Math.abs(numericDelta),
      previousStock,
      newStock,
      referenceType,
      referenceId: referenceId || '',
      reason: normalizedReason,
      createdBy,
    }], { session });

    return { product, transaction: transaction[0] };
  },

  async increaseStock({ productId, quantity, reason, referenceType = 'MANUAL', referenceId = '', createdBy, type = 'PURCHASE', session = null }) {
    const normalizedQuantity = ensurePositiveQuantity(quantity, 'quantity');
    return inventoryService.applyDelta({
      productId,
      delta: normalizedQuantity,
      reason,
      referenceType,
      referenceId,
      createdBy,
      type,
      session,
    });
  },

  async decreaseStock({ productId, quantity, reason, referenceType = 'MANUAL', referenceId = '', createdBy, type = 'SALE', session = null }) {
    const normalizedQuantity = ensurePositiveQuantity(quantity, 'quantity');
    return inventoryService.applyDelta({
      productId,
      delta: -normalizedQuantity,
      reason,
      referenceType,
      referenceId,
      createdBy,
      type,
      session,
    });
  },

  async adjustStock({ productId, adjustment, reason, referenceType = 'MANUAL', referenceId = '', createdBy, type = 'ADJUSTMENT', session = null }) {
    const normalizedAdjustment = Number(adjustment);
    if (!Number.isFinite(normalizedAdjustment)) {
      throw new Error('Adjustment must be a valid number');
    }

    return inventoryService.applyDelta({
      productId,
      delta: normalizedAdjustment,
      reason,
      referenceType,
      referenceId,
      createdBy,
      type,
      session,
    });
  },
};

export default inventoryService;

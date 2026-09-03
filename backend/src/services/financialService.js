export const validateReturnQuantity = ({ returnedQuantity, originalQuantity }) => {
  const normalizedReturned = Number(returnedQuantity);
  const normalizedOriginal = Number(originalQuantity);

  if (!Number.isFinite(normalizedReturned) || normalizedReturned <= 0) {
    throw new Error('Return quantity must be greater than 0');
  }

  if (!Number.isFinite(normalizedOriginal) || normalizedOriginal <= 0) {
    throw new Error('Original quantity must be greater than 0');
  }

  if (normalizedReturned > normalizedOriginal) {
    throw new Error(`Return quantity cannot exceed original quantity of ${normalizedOriginal}.`);
  }

  return normalizedReturned;
};

export const createSaleReturnTransaction = ({
  originalSaleTotal = 0,
  returnedQuantity,
  originalQuantity,
  unitPrice = 0,
  refundedAmount,
}) => {
  const quantity = validateReturnQuantity({ returnedQuantity, originalQuantity });
  const normalizedSaleTotal = Number(originalSaleTotal || 0);
  const normalizedUnitPrice = Number(unitPrice || 0);
  const normalizedRefund = Number(refundedAmount ?? quantity * normalizedUnitPrice);

  return {
    stockDelta: quantity,
    refundAmount: normalizedRefund,
    returnType: 'SALE_RETURN',
    originalSaleTotal: normalizedSaleTotal,
    remainingSaleTotal: Math.max(normalizedSaleTotal - normalizedRefund, 0),
  };
};

export const createPurchaseReturnTransaction = ({
  originalPurchaseTotal = 0,
  returnedQuantity,
  originalQuantity,
  unitCost = 0,
  refundAmount,
}) => {
  const quantity = validateReturnQuantity({ returnedQuantity, originalQuantity });
  const normalizedPurchaseTotal = Number(originalPurchaseTotal || 0);
  const normalizedUnitCost = Number(unitCost || 0);
  const normalizedRefund = Number(refundAmount ?? quantity * normalizedUnitCost);

  return {
    stockDelta: -quantity,
    refundAmount: normalizedRefund,
    returnType: 'PURCHASE_RETURN',
    originalPurchaseTotal: normalizedPurchaseTotal,
    remainingPurchaseTotal: Math.max(normalizedPurchaseTotal - normalizedRefund, 0),
  };
};

export default {
  validateReturnQuantity,
  createSaleReturnTransaction,
  createPurchaseReturnTransaction,
};

import mongoose from 'mongoose';

import Sale from '../models/Sale.js';
import SaleItem from '../models/SaleItem.js';
import Purchase from '../models/Purchase.js';
import PurchaseItem from '../models/PurchaseItem.js';
import Product from '../models/Product.js';
import Payment from '../models/Payment.js';
import inventoryService from '../services/inventoryService.js';
import { createSaleReturnTransaction, createPurchaseReturnTransaction, validateReturnQuantity } from '../services/financialService.js';
import { errorResponse, successResponse } from '../utils/apiResponse.js';

export const returnSale = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const { saleId, productId, quantity, refundAmount, reason } = req.body;

    if (!saleId || !productId) {
      return res.status(400).json(errorResponse('Invalid return request', ['saleId and productId are required']));
    }

    const sale = await Sale.findById(saleId).session(session).lean();
    if (!sale) {
      return res.status(400).json(errorResponse('Sale not found', ['The referenced sale does not exist']));
    }

    const saleItem = await SaleItem.findOne({ sale: sale._id, product: productId }).session(session).lean();
    if (!saleItem) {
      return res.status(400).json(errorResponse('Sale item not found', ['The product was not part of the original sale']));
    }

    const originalQuantity = Number(saleItem.quantity || 0);
    const returnedQuantity = validateReturnQuantity({ returnedQuantity: quantity, originalQuantity });
    const unitPrice = Number(saleItem.sellingPrice || 0);
    const effectiveRefund = Number(refundAmount ?? returnedQuantity * unitPrice);
    const returnSummary = createSaleReturnTransaction({
      originalSaleTotal: Number(sale.totalAmount || 0),
      returnedQuantity,
      originalQuantity,
      unitPrice,
      refundedAmount: effectiveRefund,
    });

    const product = await Product.findById(productId).session(session);
    if (!product) {
      return res.status(400).json(errorResponse('Product not found', ['Product no longer exists in inventory']));
    }

    await session.withTransaction(async () => {
      saleItem.quantity = Math.max(originalQuantity - returnedQuantity, 0);
      if (saleItem.quantity === 0) {
        await SaleItem.deleteOne({ _id: saleItem._id }).session(session);
      } else {
        await SaleItem.updateOne({ _id: saleItem._id }, { quantity: saleItem.quantity }).session(session);
      }

      await inventoryService.increaseStock({
        productId,
        quantity: returnedQuantity,
        reason: reason || `Sale return for ${sale.invoiceNumber}`,
        referenceType: 'SALE_RETURN',
        referenceId: sale._id.toString(),
        createdBy: req.user._id,
        type: 'SALE_RETURN',
        session,
      });

      const nextPaid = Math.max(Number(sale.paidAmount || 0) - effectiveRefund, 0);
      const nextRemaining = Math.max(Number(sale.totalAmount || 0) - nextPaid, 0);
      await Sale.updateOne({ _id: sale._id }, {
        paidAmount: nextPaid,
        remainingAmount: nextRemaining,
        paymentStatus: nextPaid >= Number(sale.totalAmount || 0) ? 'PAID' : nextPaid > 0 ? 'PARTIAL' : 'UNPAID',
      }).session(session);

      await Payment.create([{
        referenceType: 'REFUND',
        referenceId: sale._id.toString(),
        customer: sale.customer || null,
        supplier: null,
        amount: effectiveRefund,
        paymentMethod: 'CASH',
        paymentType: 'REFUND',
        transactionReference: `SALE_RETURN-${sale.invoiceNumber}`,
        notes: reason || `Sales return for ${product.name}`,
        createdBy: req.user._id,
      }], { session });
    });

    return res.status(200).json(successResponse({
      saleId: sale._id,
      productId,
      returnedQuantity,
      refundAmount: effectiveRefund,
      stockDelta: returnSummary.stockDelta,
      returnType: returnSummary.returnType,
    }, 'Sales return processed successfully'));
  } catch (error) {
    return next(error);
  } finally {
    await session.endSession();
  }
};

export const returnPurchase = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const { purchaseId, productId, quantity, refundAmount, reason } = req.body;

    if (!purchaseId || !productId) {
      return res.status(400).json(errorResponse('Invalid return request', ['purchaseId and productId are required']));
    }

    const purchase = await Purchase.findById(purchaseId).session(session).lean();
    if (!purchase) {
      return res.status(400).json(errorResponse('Purchase not found', ['The referenced purchase does not exist']));
    }

    const purchaseItem = await PurchaseItem.findOne({ purchase: purchase._id, product: productId }).session(session).lean();
    if (!purchaseItem) {
      return res.status(400).json(errorResponse('Purchase item not found', ['The product was not part of the original purchase']));
    }

    const originalQuantity = Number(purchaseItem.quantity || 0);
    const returnedQuantity = validateReturnQuantity({ returnedQuantity: quantity, originalQuantity });
    const unitCost = Number(purchaseItem.costPrice || 0);
    const effectiveRefund = Number(refundAmount ?? returnedQuantity * unitCost);
    const returnSummary = createPurchaseReturnTransaction({
      originalPurchaseTotal: Number(purchase.totalAmount || 0),
      returnedQuantity,
      originalQuantity,
      unitCost,
      refundAmount: effectiveRefund,
    });

    const product = await Product.findById(productId).session(session);
    if (!product) {
      return res.status(400).json(errorResponse('Product not found', ['Product no longer exists in inventory']));
    }

    await session.withTransaction(async () => {
      purchaseItem.quantity = Math.max(originalQuantity - returnedQuantity, 0);
      if (purchaseItem.quantity === 0) {
        await PurchaseItem.deleteOne({ _id: purchaseItem._id }).session(session);
      } else {
        await PurchaseItem.updateOne({ _id: purchaseItem._id }, { quantity: purchaseItem.quantity }).session(session);
      }

      await inventoryService.decreaseStock({
        productId,
        quantity: returnedQuantity,
        reason: reason || `Purchase return for ${purchase.purchaseNumber}`,
        referenceType: 'PURCHASE_RETURN',
        referenceId: purchase._id.toString(),
        createdBy: req.user._id,
        type: 'PURCHASE_RETURN',
        session,
      });

      const nextPaid = Math.max(Number(purchase.paidAmount || 0) - effectiveRefund, 0);
      const nextRemaining = Math.max(Number(purchase.totalAmount || 0) - nextPaid, 0);
      await Purchase.updateOne({ _id: purchase._id }, {
        paidAmount: nextPaid,
        remainingAmount: nextRemaining,
        paymentStatus: nextPaid >= Number(purchase.totalAmount || 0) ? 'PAID' : nextPaid > 0 ? 'PARTIAL' : 'UNPAID',
      }).session(session);

      await Payment.create([{
        referenceType: 'REFUND',
        referenceId: purchase._id.toString(),
        customer: null,
        supplier: purchase.supplier || null,
        amount: effectiveRefund,
        paymentMethod: 'CASH',
        paymentType: 'REFUND',
        transactionReference: `PURCHASE_RETURN-${purchase.purchaseNumber}`,
        notes: reason || `Purchase return for ${product.name}`,
        createdBy: req.user._id,
      }], { session });
    });

    return res.status(200).json(successResponse({
      purchaseId: purchase._id,
      productId,
      returnedQuantity,
      refundAmount: effectiveRefund,
      stockDelta: returnSummary.stockDelta,
      returnType: returnSummary.returnType,
    }, 'Purchase return processed successfully'));
  } catch (error) {
    return next(error);
  } finally {
    await session.endSession();
  }
};

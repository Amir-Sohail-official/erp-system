import { z } from 'zod';

export const purchaseItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.coerce.number({ invalid_type_error: 'Quantity must be a number' }).min(1, 'Quantity must be at least 1'),
  discount: z.coerce.number({ invalid_type_error: 'Discount must be a number' }).min(0, 'Discount cannot be negative').optional().default(0),
  tax: z.coerce.number({ invalid_type_error: 'Tax must be a number' }).min(0, 'Tax cannot be negative').optional().default(0),
});

export const purchaseSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  paidAmount: z.coerce.number({ invalid_type_error: 'Paid amount must be a number' }).min(0, 'Paid amount cannot be negative').optional().default(0),
  items: z.array(purchaseItemSchema).min(1, 'At least one purchase item is required'),
});

export const validateRequest = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues.map((issue) => issue.message),
      });
    }
    req.body = result.data;
    return next();
  } catch (error) {
    return next(error);
  }
};

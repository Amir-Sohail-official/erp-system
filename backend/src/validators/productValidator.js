import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().trim().min(2, 'Product name is required'),
  sku: z.string().trim().min(2, 'SKU is required').max(100).transform((value) => value.toUpperCase()),
  barcode: z.string().trim().max(100).optional().or(z.literal('')).transform((value) => value || ''),
  category: z.string().min(1, 'Category is required'),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  costPrice: z.coerce.number({ invalid_type_error: 'Cost price must be a number' }).min(0, 'Cost price must be 0 or greater'),
  sellingPrice: z.coerce.number({ invalid_type_error: 'Selling price must be a number' }).min(0, 'Selling price must be 0 or greater'),
  stock: z.coerce.number({ invalid_type_error: 'Stock must be a number' }).min(0, 'Stock cannot be negative'),
  minimumStock: z.coerce.number({ invalid_type_error: 'Minimum stock must be a number' }).min(0, 'Minimum stock cannot be negative'),
  unit: z.string().trim().min(1, 'Unit is required').max(50),
  isActive: z.boolean().optional(),
});

export const updateProductSchema = productSchema.partial();

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

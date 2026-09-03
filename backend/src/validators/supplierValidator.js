import { z } from 'zod';

export const supplierSchema = z.object({
  name: z.string().trim().min(2, 'Supplier name is required'),
  email: z.string().trim().email('A valid email is required').optional().or(z.literal('')),
  phone: z.string().trim().min(5, 'Phone number is required').optional().or(z.literal('')),
  address: z.string().trim().max(300).optional().or(z.literal('')),
  city: z.string().trim().max(100).optional().or(z.literal('')),
  openingBalance: z.coerce.number({ invalid_type_error: 'Opening balance must be a number' }).min(0, 'Opening balance cannot be negative'),
  isActive: z.boolean().optional(),
});

export const updateSupplierSchema = supplierSchema.partial();

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

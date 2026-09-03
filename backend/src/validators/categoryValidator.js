import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().trim().min(2, 'Category name is required').max(100),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

export const updateCategorySchema = categorySchema.partial();

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

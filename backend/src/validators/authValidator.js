import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must contain at least 2 characters'),
  email: z.string().trim().email('A valid email is required'),
  password: z.string().min(6, 'Password must contain at least 6 characters'),
  phone: z.string().trim().min(5, 'Phone number is required').optional().or(z.literal('')),
});

export const loginSchema = z.object({
  email: z.string().trim().email('A valid email is required'),
  password: z.string().min(6, 'Password must contain at least 6 characters'),
});

export const validateRequest = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => issue.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    req.body = result.data;
    return next();
  } catch (error) {
    return next(error);
  }
};

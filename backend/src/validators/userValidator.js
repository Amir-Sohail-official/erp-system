import { z } from 'zod';

const email = z.string().trim().email('A valid email is required').max(160).transform((value) => value.toLowerCase());
const phone = z.string().trim().max(40, 'Phone cannot exceed 40 characters').optional().or(z.literal('')).transform((value) => value || '');
const role = z.string().trim().min(1, 'Role is required');

export const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  email,
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  phone,
  role,
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120).optional(),
  email: email.optional(),
  phone,
  role: role.optional(),
  isActive: z.boolean().optional(),
});

export const validateRequest = (schema) => (req, res, next) => {
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
};

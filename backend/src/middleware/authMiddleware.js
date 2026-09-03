import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import User from '../models/User.js';

export const getJwtSecret = () => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error('JWT secret is not configured securely');
  }

  return jwtSecret;
};

export const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export const validateObjectIdParam = (paramName) => (req, res, next) => {
  const value = req.params?.[paramName];

  if (!value || !isValidObjectId(value)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid resource identifier',
      errors: [`The ${paramName} parameter is invalid.`],
    });
  }

  return next();
};

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        errors: ['No valid token provided'],
      });
    }

    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
    const user = await User.findById(decoded.userId).populate('role').exec();

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed',
        errors: ['User no longer exists or is inactive'],
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      errors: ['Authentication failed'],
    });
  }
};

export const authorize = (...requiredPermissions) => (req, res, next) => {
  const userRole = req.user?.role;

  if (!userRole || !userRole.permissions) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden',
      errors: ['You do not have permission to perform this action'],
    });
  }

  const userPermissions = userRole.permissions;
  const hasAccess = requiredPermissions.every((permission) => userPermissions.includes(permission));

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'Permission denied',
      errors: ['You do not have permission to perform this action'],
    });
  }

  return next();
};

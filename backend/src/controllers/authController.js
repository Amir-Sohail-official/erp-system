import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import Role from '../models/Role.js';
import User from '../models/User.js';
import { ROLE_DEFINITIONS } from '../utils/permissions.js';

const signToken = (userId) => {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error('JWT secret is not configured securely');
  }

  return jwt.sign({ userId }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists',
        errors: ['A user with this email already exists'],
      });
    }

    let role = await Role.findOne({ name: 'Manager' });
    if (!role) {
      const roleData = await Role.create({
        name: 'Manager',
        description: 'Manager role for ERP access control',
        permissions: ROLE_DEFINITIONS.Manager,
      });
      role = roleData;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || '',
      role: role._id,
      isActive: true,
    });

    const token = signToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        token,
        user: sanitizeUser(await User.findById(user._id).populate('role').exec()),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password').populate('role').exec();

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        errors: ['Email or password is incorrect'],
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        errors: ['Email or password is incorrect'],
      });
    }

    const token = signToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const logoutUser = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logout successful',
    data: null,
  });
};

export const getCurrentUser = async (req, res) => {
  const user = await User.findById(req.user._id).populate('role').exec();

  return res.status(200).json({
    success: true,
    message: 'Current user fetched successfully',
    data: sanitizeUser(user),
  });
};

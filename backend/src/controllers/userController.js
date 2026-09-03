import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import Role from '../models/Role.js';
import User from '../models/User.js';
import { errorResponse, successResponse } from '../utils/apiResponse.js';

const userProjection = '-password';

const sanitizeUser = (user) => {
  const value = user?.toObject ? user.toObject() : { ...user };
  delete value.password;
  return value;
};

const findRole = async (roleId) => {
  if (!mongoose.Types.ObjectId.isValid(roleId)) return null;
  return Role.findById(roleId).lean();
};

const canAssignRole = (actor, targetRole) => {
  const actorPermissions = new Set(actor.role?.permissions || []);
  return (targetRole?.permissions || []).every((permission) => actorPermissions.has(permission));
};

const isOnlyActiveAdmin = async (user) => {
  if (user.role?.name !== 'Admin' || !user.isActive) return false;
  const activeAdmins = await User.countDocuments({ role: user.role._id, isActive: true });
  return activeAdmins <= 1;
};

const getUser = (id) => User.findById(id).select(userProjection).populate('role').lean();

export const listUsers = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;
    const query = {};
    const search = req.query.search?.trim();

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    if (req.query.role && mongoose.Types.ObjectId.isValid(req.query.role)) query.role = req.query.role;
    if (req.query.active === 'true' || req.query.active === 'false') query.isActive = req.query.active === 'true';

    const [items, total, roles] = await Promise.all([
      User.find(query).select(userProjection).populate('role').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(query),
      Role.find({}).select('name permissions').sort({ name: 1 }).lean(),
    ]);

    return res.status(200).json(successResponse({
      items: items.map(sanitizeUser),
      roles,
      pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
    }, 'Users fetched successfully'));
  } catch (error) {
    return next(error);
  }
};

export const listRoles = async (req, res, next) => {
  try {
    const roles = await Role.find({}).select('name permissions').sort({ name: 1 }).lean();
    return res.status(200).json(successResponse(roles, 'Roles fetched successfully'));
  } catch (error) {
    return next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await getUser(req.params.id);
    if (!user) return res.status(404).json(errorResponse('User not found', ['User does not exist']));
    return res.status(200).json(successResponse(sanitizeUser(user), 'User fetched successfully'));
  } catch (error) {
    return next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, role: roleId } = req.body;
    const targetRole = await findRole(roleId);
    if (!targetRole) return res.status(400).json(errorResponse('Role not found', ['The selected role does not exist']));
    if (!canAssignRole(req.user, targetRole)) return res.status(403).json(errorResponse('Permission denied', ['You cannot assign a role with greater permissions than your own']));

    if (await User.exists({ email })) return res.status(409).json(errorResponse('Email already exists', ['A user with this email already exists']));

    const user = await User.create({ name, email, password: await bcrypt.hash(password, 12), phone, role: targetRole._id, isActive: true });
    const created = await getUser(user._id);
    return res.status(201).json(successResponse(sanitizeUser(created), 'User created successfully'));
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json(errorResponse('Email already exists', ['A user with this email already exists']));
    return next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('role');
    if (!user) return res.status(404).json(errorResponse('User not found', ['User does not exist']));

    const { name, email, phone, role: roleId, isActive } = req.body;
    if (email && email !== user.email && await User.exists({ email, _id: { $ne: user._id } })) {
      return res.status(409).json(errorResponse('Email already exists', ['A user with this email already exists']));
    }

    const nextRole = roleId ? await findRole(roleId) : user.role;
    if (!nextRole) return res.status(400).json(errorResponse('Role not found', ['The selected role does not exist']));
    if (!canAssignRole(req.user, nextRole)) return res.status(403).json(errorResponse('Permission denied', ['You cannot assign a role with greater permissions than your own']));

    const changingSelf = user._id.toString() === req.user._id.toString();
    if (changingSelf && (isActive === false || (roleId && nextRole.name !== req.user.role?.name))) {
      return res.status(400).json(errorResponse('Unsafe account change', ['You cannot deactivate yourself or change your own role']));
    }
    if ((isActive === false || (roleId && user.role.name === 'Admin' && nextRole.name !== 'Admin')) && await isOnlyActiveAdmin(user)) {
      return res.status(400).json(errorResponse('Administrator required', ['The only active administrator cannot be deactivated or demoted']));
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (roleId !== undefined) user.role = nextRole._id;
    if (isActive !== undefined) user.isActive = isActive;
    await user.save();
    return res.status(200).json(successResponse(sanitizeUser(await getUser(user._id)), 'User updated successfully'));
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json(errorResponse('Email already exists', ['A user with this email already exists']));
    return next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('role');
    if (!user) return res.status(404).json(errorResponse('User not found', ['User does not exist']));
    if (user._id.toString() === req.user._id.toString()) return res.status(400).json(errorResponse('Unsafe account change', ['You cannot deactivate your own account']));
    if (await isOnlyActiveAdmin(user)) return res.status(400).json(errorResponse('Administrator required', ['The only active administrator cannot be deactivated']));

    user.isActive = false;
    await user.save();
    return res.status(200).json(successResponse(null, 'User deactivated successfully'));
  } catch (error) {
    return next(error);
  }
};

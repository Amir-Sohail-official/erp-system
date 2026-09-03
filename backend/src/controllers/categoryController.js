import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { errorResponse, successResponse } from '../utils/apiResponse.js';

export const listCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    return res.status(200).json(successResponse(categories, 'Categories fetched successfully'));
  } catch (error) {
    return next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, description, isActive } = req.body;

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json(errorResponse('Category name already exists', ['A category with this name already exists']));
    }

    const category = await Category.create({
      name: name.trim(),
      description: description || '',
      isActive: isActive ?? true,
    });

    return res.status(201).json(successResponse(category, 'Category created successfully'));
  } catch (error) {
    return next(error);
  }
};

export const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json(errorResponse('Category not found', ['Category does not exist']));
    }

    return res.status(200).json(successResponse(category, 'Category fetched successfully'));
  } catch (error) {
    return next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { name, description, isActive } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json(errorResponse('Category not found', ['Category does not exist']));
    }

    if (name && name.trim() !== category.name) {
      const duplicate = await Category.findOne({ name: name.trim() });
      if (duplicate && duplicate._id.toString() !== category._id.toString()) {
        return res.status(409).json(errorResponse('Category name already exists', ['A category with this name already exists']));
      }
    }

    category.name = name?.trim() || category.name;
    category.description = description ?? category.description;
    category.isActive = isActive ?? category.isActive;
    await category.save();

    return res.status(200).json(successResponse(category, 'Category updated successfully'));
  } catch (error) {
    return next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json(errorResponse('Category not found', ['Category does not exist']));
    }

    const productExists = await Product.findOne({ category: category._id });
    if (productExists) {
      return res.status(400).json(errorResponse('Category is in use', ['This category is assigned to at least one product']));
    }

    await category.deleteOne();
    return res.status(200).json(successResponse(null, 'Category deleted successfully'));
  } catch (error) {
    return next(error);
  }
};

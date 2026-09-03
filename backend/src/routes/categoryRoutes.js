import { Router } from 'express';

import { createCategory, deleteCategory, getCategoryById, listCategories, updateCategory } from '../controllers/categoryController.js';
import { protect, authorize, validateObjectIdParam } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { categorySchema, validateRequest, updateCategorySchema } from '../validators/categoryValidator.js';

const router = Router();

router.use(protect);

router.get('/', authorize(PERMISSIONS.CATEGORIES_READ), listCategories);
router.post('/', authorize(PERMISSIONS.CATEGORIES_CREATE), validateRequest(categorySchema), createCategory);
router.get('/:id', authorize(PERMISSIONS.CATEGORIES_READ), validateObjectIdParam('id'), getCategoryById);
router.put('/:id', authorize(PERMISSIONS.CATEGORIES_UPDATE), validateObjectIdParam('id'), validateRequest(updateCategorySchema), updateCategory);
router.delete('/:id', authorize(PERMISSIONS.CATEGORIES_DELETE), validateObjectIdParam('id'), deleteCategory);

export default router;

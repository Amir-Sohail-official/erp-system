import { Router } from 'express';

import { createProduct, deleteProduct, getProductById, listProducts, updateProduct } from '../controllers/productController.js';
import { protect, authorize, validateObjectIdParam } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { productSchema, updateProductSchema, validateRequest } from '../validators/productValidator.js';

const router = Router();

router.use(protect);

router.get('/', authorize(PERMISSIONS.PRODUCTS_READ), listProducts);
router.post('/', authorize(PERMISSIONS.PRODUCTS_CREATE), validateRequest(productSchema), createProduct);
router.get('/:id', authorize(PERMISSIONS.PRODUCTS_READ), validateObjectIdParam('id'), getProductById);
router.put('/:id', authorize(PERMISSIONS.PRODUCTS_UPDATE), validateObjectIdParam('id'), validateRequest(updateProductSchema), updateProduct);
router.delete('/:id', authorize(PERMISSIONS.PRODUCTS_DELETE), validateObjectIdParam('id'), deleteProduct);

export default router;

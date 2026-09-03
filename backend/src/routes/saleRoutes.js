import { Router } from 'express';

import { createSale, getSaleById, listSales } from '../controllers/saleController.js';
import { protect, authorize, validateObjectIdParam } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { saleSchema, validateRequest } from '../validators/saleValidator.js';

const router = Router();

router.use(protect);

router.get('/', authorize(PERMISSIONS.SALES_READ), listSales);
router.post('/', authorize(PERMISSIONS.SALES_CREATE), validateRequest(saleSchema), createSale);
router.get('/:id', authorize(PERMISSIONS.SALES_READ), validateObjectIdParam('id'), getSaleById);

export default router;

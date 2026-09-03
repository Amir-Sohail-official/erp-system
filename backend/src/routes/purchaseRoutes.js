import { Router } from 'express';

import { createPurchase, getPurchaseById, listPurchases } from '../controllers/purchaseController.js';
import { protect, authorize, validateObjectIdParam } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { purchaseSchema, validateRequest } from '../validators/purchaseValidator.js';

const router = Router();

router.use(protect);

router.get('/', authorize(PERMISSIONS.PURCHASES_READ), listPurchases);
router.post('/', authorize(PERMISSIONS.PURCHASES_CREATE), validateRequest(purchaseSchema), createPurchase);
router.get('/:id', authorize(PERMISSIONS.PURCHASES_READ), validateObjectIdParam('id'), getPurchaseById);

export default router;

import { Router } from 'express';

import { createPayment, getPaymentById, listPayments } from '../controllers/paymentController.js';
import { protect, authorize, validateObjectIdParam } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../utils/permissions.js';

const router = Router();

router.use(protect);

router.get('/', authorize(PERMISSIONS.PAYMENTS_READ), listPayments);
router.post('/', authorize(PERMISSIONS.PAYMENTS_CREATE), createPayment);
router.get('/:id', authorize(PERMISSIONS.PAYMENTS_READ), validateObjectIdParam('id'), getPaymentById);

export default router;

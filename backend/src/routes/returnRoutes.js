import { Router } from 'express';

import { returnPurchase, returnSale } from '../controllers/returnController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../utils/permissions.js';

const router = Router();

router.use(protect);
router.post('/sales', authorize(PERMISSIONS.SALES_UPDATE), returnSale);
router.post('/purchases', authorize(PERMISSIONS.PURCHASES_UPDATE), returnPurchase);

export default router;

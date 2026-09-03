import { Router } from 'express';

import { getInventoryReport, getProfitReport, getPurchasesReport, getSalesReport } from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../utils/permissions.js';

const router = Router();

router.use(protect);

router.get('/sales', authorize(PERMISSIONS.REPORTS_READ), getSalesReport);
router.get('/purchases', authorize(PERMISSIONS.REPORTS_READ), getPurchasesReport);
router.get('/inventory', authorize(PERMISSIONS.REPORTS_READ), getInventoryReport);
router.get('/profit', authorize(PERMISSIONS.REPORTS_READ), getProfitReport);

export default router;

import { Router } from 'express';

import { getDashboard } from '../controllers/dashboardController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../utils/permissions.js';

const router = Router();

router.use(protect);
router.get('/', authorize(PERMISSIONS.REPORTS_READ), getDashboard);

export default router;

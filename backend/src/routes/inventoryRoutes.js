import { Router } from 'express';

import { adjustInventory, getInventoryByProduct, getInventoryHistory, getLowStockProducts, listInventory } from '../controllers/inventoryController.js';
import { protect, authorize, validateObjectIdParam } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../utils/permissions.js';

const router = Router();

router.use(protect);

router.get('/', authorize(PERMISSIONS.INVENTORY_READ), listInventory);
router.get('/low-stock', authorize(PERMISSIONS.INVENTORY_READ), getLowStockProducts);
router.get('/:productId/history', authorize(PERMISSIONS.INVENTORY_READ), validateObjectIdParam('productId'), getInventoryHistory);
router.get('/:productId', authorize(PERMISSIONS.INVENTORY_READ), validateObjectIdParam('productId'), getInventoryByProduct);
router.post('/:productId/adjust', authorize(PERMISSIONS.INVENTORY_UPDATE), validateObjectIdParam('productId'), adjustInventory);

export default router;

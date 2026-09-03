import { Router } from 'express';

import { createSupplier, deleteSupplier, getSupplierById, listSuppliers, updateSupplier } from '../controllers/supplierController.js';
import { protect, authorize, validateObjectIdParam } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { supplierSchema, updateSupplierSchema, validateRequest } from '../validators/supplierValidator.js';

const router = Router();

router.use(protect);

router.get('/', authorize(PERMISSIONS.SUPPLIERS_READ), listSuppliers);
router.post('/', authorize(PERMISSIONS.SUPPLIERS_CREATE), validateRequest(supplierSchema), createSupplier);
router.get('/:id', authorize(PERMISSIONS.SUPPLIERS_READ), validateObjectIdParam('id'), getSupplierById);
router.put('/:id', authorize(PERMISSIONS.SUPPLIERS_UPDATE), validateObjectIdParam('id'), validateRequest(updateSupplierSchema), updateSupplier);
router.delete('/:id', authorize(PERMISSIONS.SUPPLIERS_DELETE), validateObjectIdParam('id'), deleteSupplier);

export default router;

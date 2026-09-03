import { Router } from 'express';

import { createCustomer, deleteCustomer, getCustomerById, listCustomers, updateCustomer } from '../controllers/customerController.js';
import { protect, authorize, validateObjectIdParam } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { customerSchema, updateCustomerSchema, validateRequest } from '../validators/customerValidator.js';

const router = Router();

router.use(protect);

router.get('/', authorize(PERMISSIONS.CUSTOMERS_READ), listCustomers);
router.post('/', authorize(PERMISSIONS.CUSTOMERS_CREATE), validateRequest(customerSchema), createCustomer);
router.get('/:id', authorize(PERMISSIONS.CUSTOMERS_READ), validateObjectIdParam('id'), getCustomerById);
router.put('/:id', authorize(PERMISSIONS.CUSTOMERS_UPDATE), validateObjectIdParam('id'), validateRequest(updateCustomerSchema), updateCustomer);
router.delete('/:id', authorize(PERMISSIONS.CUSTOMERS_DELETE), validateObjectIdParam('id'), deleteCustomer);

export default router;

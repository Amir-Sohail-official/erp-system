import { Router } from 'express';

import { createUser, deleteUser, getUserById, listRoles, listUsers, updateUser } from '../controllers/userController.js';
import { protect, authorize, validateObjectIdParam } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { createUserSchema, updateUserSchema, validateRequest } from '../validators/userValidator.js';

const router = Router();

router.use(protect);

router.get('/', authorize(PERMISSIONS.USERS_READ), listUsers);
router.get('/roles', authorize(PERMISSIONS.USERS_READ), listRoles);
router.post('/', authorize(PERMISSIONS.USERS_CREATE), validateRequest(createUserSchema), createUser);
router.get('/:id', authorize(PERMISSIONS.USERS_READ), validateObjectIdParam('id'), getUserById);
router.put('/:id', authorize(PERMISSIONS.USERS_UPDATE), validateObjectIdParam('id'), validateRequest(updateUserSchema), updateUser);
router.delete('/:id', authorize(PERMISSIONS.USERS_DELETE), validateObjectIdParam('id'), deleteUser);

export default router;

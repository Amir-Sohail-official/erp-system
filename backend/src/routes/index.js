import { Router } from 'express';

import authRoutes from './authRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import customerRoutes from './customerRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import inventoryRoutes from './inventoryRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import productRoutes from './productRoutes.js';
import purchaseRoutes from './purchaseRoutes.js';
import reportRoutes from './reportRoutes.js';
import returnRoutes from './returnRoutes.js';
import saleRoutes from './saleRoutes.js';
import supplierRoutes from './supplierRoutes.js';
import userRoutes from './userRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/customers', customerRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/sales', saleRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/payments', paymentRoutes);
router.use('/returns', returnRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    data: { status: 'ok' },
  });
});

router.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API structure initialized',
    data: {
      routes: ['/api/auth/register', '/api/auth/login', '/api/auth/logout', '/api/auth/me', '/api/users', '/api/categories', '/api/products', '/api/customers', '/api/suppliers', '/api/sales', '/api/purchases', '/api/inventory', '/api/payments', '/api/reports', '/api/dashboard'],
    },
  });
});

export default router;

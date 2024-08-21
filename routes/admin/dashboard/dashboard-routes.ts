import express, { Router } from 'express';

import authMiddleware from '../../../middleware/admin/auth-middleware';
import userPermissionMiddleware from '../../../middleware/admin/admin-user-permission-roll-middleware';
import { permissionBlocks } from '../../../src/constants/permission-blocks';

import DashboardController from '../../../src/controllers/admin/dashboard/dashboard-controller';

const router: Router = express.Router();

router.use(authMiddleware);

router.get('/', userPermissionMiddleware({ permissionBlock: permissionBlocks.dashboards.orders, readOnly: 1 }), DashboardController.dashboardOrder);
router.get('/dashboard-analytics', userPermissionMiddleware({ permissionBlock: permissionBlocks.dashboards.analytics, readOnly: 1 }), DashboardController.dashboardAnalytics);
router.get('/dashboard-customers', userPermissionMiddleware({ permissionBlock: permissionBlocks.dashboards.analytics, readOnly: 1 }), DashboardController.dashboardCustomers);

export default router;

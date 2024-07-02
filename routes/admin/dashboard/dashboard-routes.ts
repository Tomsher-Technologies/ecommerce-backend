import express, { Request, Response, NextFunction, Router } from 'express';

import { logResponseStatus } from '../../../src/components/response-status';
import authMiddleware from '../../../middleware/admin/auth-middleware';
import userPermissionMiddleware from '../../../middleware/admin/admin-user-permission-roll-middleware';
import { permissionBlocks } from '../../../src/constants/permission-blocks';

// import DashboardController from '../../../src/controllers/admin/dashboard/dashboard-controller';

const router: Router = express.Router();

router.use(authMiddleware);

// router.get('/', userPermissionMiddleware({ permissionBlock: permissionBlocks.dashboards.offers }), DashboardController.dashboard);


export default router;

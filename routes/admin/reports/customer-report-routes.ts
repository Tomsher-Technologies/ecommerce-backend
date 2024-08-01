import express, { Request, Response, NextFunction, Router } from 'express';

import { logResponseStatus } from '../../../src/components/response-status';
import authMiddleware from '../../../middleware/admin/auth-middleware';
import userPermissionMiddleware from '../../../middleware/admin/admin-user-permission-roll-middleware';
import { permissionBlocks } from '../../../src/constants/permission-blocks';

import CustomerReportController from '../../../src/controllers/admin/reports/customer-report';

const router: Router = express.Router();

router.use(authMiddleware);

router.get('/customer-report', userPermissionMiddleware({ permissionBlock: permissionBlocks.orders.orders, readOnly: 1 }), CustomerReportController.findAll);

export default router;

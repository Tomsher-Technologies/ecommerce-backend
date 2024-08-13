import express, { Request, Response, NextFunction, Router } from 'express';

import { logResponseStatus } from '../../../src/components/response-status';
import authMiddleware from '../../../middleware/admin/auth-middleware';
import userPermissionMiddleware from '../../../middleware/admin/admin-user-permission-roll-middleware';
import { permissionBlocks } from '../../../src/constants/permission-blocks';
import OrderReportController from '../../../src/controllers/admin/report/order-report-controller';


const router: Router = express.Router();

router.use(authMiddleware);
router.get('/order-report', userPermissionMiddleware({ permissionBlock: permissionBlocks.orders.orders, readOnly: 1 }), OrderReportController.orderReport);


export default router;

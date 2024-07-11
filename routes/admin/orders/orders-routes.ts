import express, { Request, Response, NextFunction, Router } from 'express';

import { logResponseStatus } from '../../../src/components/response-status';
import authMiddleware from '../../../middleware/admin/auth-middleware';
import userPermissionMiddleware from '../../../middleware/admin/admin-user-permission-roll-middleware';
import { permissionBlocks } from '../../../src/constants/permission-blocks';

import OrdersController from '../../../src/controllers/admin/order/order-controller';

const router: Router = express.Router();

router.use(authMiddleware);

router.get('/order-list', userPermissionMiddleware({ permissionBlock: permissionBlocks.orders.orders }), OrdersController.findAll);
router.get('/order-detail/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.orders.orders }), OrdersController.getOrderDetails);
router.post('/order-status-change/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.orders.orders }), OrdersController.orderStatusChange);


export default router;

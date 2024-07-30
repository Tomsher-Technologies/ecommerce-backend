import express, { Request, Response, NextFunction, Router } from 'express';

import { logResponseStatus } from '../../../src/components/response-status';
import authMiddleware from '../../../middleware/admin/auth-middleware';
import userPermissionMiddleware from '../../../middleware/admin/admin-user-permission-roll-middleware';
import { permissionBlocks } from '../../../src/constants/permission-blocks';

import OrdersController from '../../../src/controllers/admin/order/order-controller';

const router: Router = express.Router();
router.get('/invoice-detail/:id', OrdersController.getInvoice);

router.use(authMiddleware);

router.get('/order-list', userPermissionMiddleware({ permissionBlock: permissionBlocks.orders.orders, readOnly: 1 }), OrdersController.findAll);
router.get('/order-detail/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.orders.orders, readOnly: 1 }), OrdersController.getOrderDetails);
router.post('/order-status-change/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.orders.orders, writeOnly: 1 }), OrdersController.orderStatusChange);


export default router;

import express, { Request, Response, NextFunction, Router } from 'express';

import { logResponseStatus } from '../../../src/components/response-status';
import authMiddleware from '../../../middleware/admin/auth-middleware';
import userPermissionMiddleware from '../../../middleware/admin/admin-user-permission-roll-middleware';
import { permissionBlocks } from '../../../src/constants/permission-blocks';

import OrdersController from '../../../src/controllers/admin/order/order-controller';
import TransactionsController from '../../../src/controllers/admin/order/transactions-controller';

const router: Router = express.Router();
router.get('/invoice-detail/:id', OrdersController.getInvoice);

router.use(authMiddleware);

router.get('/order-list', userPermissionMiddleware({ permissionBlock: permissionBlocks.orders.orders, readOnly: 1 }), OrdersController.findAll);
router.get('/order-detail/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.orders.orders, readOnly: 1 }), OrdersController.getOrderDetails);
router.post('/order-status-change/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.orders.orders, writeOnly: 1 }), OrdersController.orderStatusChange);
router.get('/order-return-products', userPermissionMiddleware({ permissionBlock: permissionBlocks.orders.orderReturn, readOnly: 1 }), OrdersController.getOrdeReturnProducts);
router.post('/order-return-status-change/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.orders.orders, writeOnly: 1 }), OrdersController.orderProductReturnStatusChange);
router.post('/order-quantity-change/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.orders.orders, writeOnly: 1 }), OrdersController.orderProductReturnQuantityChange);
router.post('/order-product-status-change/:orderID/:orderProductId', userPermissionMiddleware({ permissionBlock: permissionBlocks.orders.orders, writeOnly: 1 }), OrdersController.orderProductStatusChange);
router.post('/order-product-cancel-status-change/:orderID/:orderProductId', userPermissionMiddleware({ permissionBlock: permissionBlocks.orders.orders, writeOnly: 1 }), OrdersController.orderProductCancelStatusChange);
router.get('/transactions', userPermissionMiddleware({ permissionBlock: permissionBlocks.orders.transactions, writeOnly: 1 }), TransactionsController.findAll);


export default router;

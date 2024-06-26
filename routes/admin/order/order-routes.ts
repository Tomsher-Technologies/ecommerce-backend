import express, { Request, Response, NextFunction, Router } from 'express';

import { logResponseStatus } from '../../../src/components/response-status';
import authMiddleware from '../../../middleware/admin/auth-middleware';
import userPermissionMiddleware from '../../../middleware/admin/admin-user-permission-roll-middleware';
import { permissionBlocks } from '../../../src/constants/permission-blocks';

import OrdersController from '../../../src/controllers/admin/order/order-controller';

const router: Router = express.Router();

router.use(authMiddleware);

router.get('/order-list', OrdersController.findAll);
router.get('/order-detail/:id', OrdersController.getOrderDetails);


export default router;

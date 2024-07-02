import express, { Request, Response, NextFunction, Router } from 'express';

import { logResponseStatus } from '../../../src/components/response-status';
import authMiddleware from '../../../middleware/admin/auth-middleware';
import userPermissionMiddleware from '../../../middleware/admin/admin-user-permission-roll-middleware';
import { permissionBlocks } from '../../../src/constants/permission-blocks';

import CustomerController from '../../../src/controllers/admin/customer/customer-controller';

const router: Router = express.Router();

router.use(authMiddleware);

router.get('/customer-list', userPermissionMiddleware({ permissionBlock: permissionBlocks.customers.customers }), CustomerController.findAll);
router.get('/customer-detail/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.customers.customers }), CustomerController.findCustomer);


export default router;

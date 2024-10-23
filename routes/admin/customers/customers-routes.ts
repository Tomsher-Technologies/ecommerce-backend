import express, { Request, Response, NextFunction, Router } from 'express';

import { logResponseStatus } from '../../../src/components/response-status';
import authMiddleware from '../../../middleware/admin/auth-middleware';
import userPermissionMiddleware from '../../../middleware/admin/admin-user-permission-roll-middleware';
import { permissionBlocks } from '../../../src/constants/permission-blocks';

import CustomerController from '../../../src/controllers/admin/customer/customer-controller';
import { configureMulterExcel } from '../../../src/utils/file-uploads';

const router: Router = express.Router();
const { uploadExcel } = configureMulterExcel('customer/excel', ['customerExcel',]);

router.use(authMiddleware);

router.get('/customer-list', userPermissionMiddleware({ permissionBlock: permissionBlocks.customers.customers, readOnly: 1 }), CustomerController.findAll);
router.get('/customer-detail/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.customers.customers, readOnly: 1 }), CustomerController.findCustomer);
router.post('/import-excel', userPermissionMiddleware({ permissionBlock: permissionBlocks.customers.customers, writeOnly: 1 }), uploadExcel.single('customerExcel'), CustomerController.importExcel);
router.get('/wishlist', userPermissionMiddleware({ permissionBlock: permissionBlocks.customers.wishlist, readOnly: 1 }), CustomerController.findAllWishlist);

export default router;

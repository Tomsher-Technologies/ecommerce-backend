import express, { Request, Response, NextFunction, Router } from 'express';

import { logResponseStatus } from '../../../src/components/response-status';
import authMiddleware from '../../../middleware/admin/auth-middleware';
import userPermissionMiddleware from '../../../middleware/admin/admin-user-permission-roll-middleware';
import { permissionBlocks } from '../../../src/constants/permission-blocks';

import ReviewController from '../../../src/controllers/admin/customer/review-controller';
import { configureMulterExcel } from '../../../src/utils/file-uploads';

const router: Router = express.Router();

router.use(authMiddleware);

router.get('/review-list', userPermissionMiddleware({ permissionBlock: permissionBlocks.customers.reviews, readOnly: 1 }), ReviewController.findAll);
router.post('/status-change/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.customers.reviews, writeOnly: 1 }), ReviewController.statusChange);


export default router;

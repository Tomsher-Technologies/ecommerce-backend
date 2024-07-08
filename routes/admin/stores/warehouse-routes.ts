import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';

import { logResponseStatus } from '../../../src/components/response-status';

import authMiddleware from '../../../middleware/admin/auth-middleware';
import userPermissionMiddleware from '../../../middleware/admin/admin-user-permission-roll-middleware';
import { permissionBlocks } from '../../../src/constants/permission-blocks';

import WarehouseController from '../../../src/controllers/admin/stores/warehouse-controller';

const router: Router = express.Router();


router.use(authMiddleware);

router.get('/', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.stores.warehouse, readOnly: 1 }), WarehouseController.findAll);
router.get('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.stores.warehouse, readOnly: 1 }), WarehouseController.findOne);
router.post('/', userPermissionMiddleware({ permissionBlock: permissionBlocks.stores.warehouse, writeOnly: 1 }), logResponseStatus, WarehouseController.create);
router.post('/:id', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.stores.warehouse, writeOnly: 1 }), WarehouseController.update);
router.post('/status-change/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.stores.warehouse, writeOnly: 1 }), WarehouseController.statusChange);
router.delete('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.stores.warehouse }), WarehouseController.destroy);



export default router;

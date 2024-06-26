import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';

import { logResponseStatus } from '../../../src/components/response-status';
import { configureMulter } from '../../../src/utils/file-uploads';

import authMiddleware from '../../../middleware/admin/auth-middleware';
import userPermissionMiddleware from '../../../middleware/admin/admin-user-permission-roll-middleware';
import { permissionBlocks } from '../../../src/constants/permission-blocks';

import StoreController from '../../../src/controllers/admin/stores/store-controller';

const router: Router = express.Router();

const { upload } = configureMulter('store', ['storeImage',]);

router.use(authMiddleware);

router.get('/', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.stores.store, readOnly: 1 }), StoreController.findAll);
router.get('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.stores.store, readOnly: 1 }), StoreController.findOne);
router.post('/', upload.single('storeImage'), userPermissionMiddleware({ permissionBlock: permissionBlocks.stores.store, writeOnly: 1 }), logResponseStatus, StoreController.create);
router.post('/:id', upload.single('storeImage'), logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.stores.store, writeOnly: 1 }), StoreController.update);
router.post('/status-change/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.stores.store, writeOnly: 1 }), StoreController.statusChange);
router.delete('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.stores.store }), StoreController.destroy);



export default router;

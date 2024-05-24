import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';

import { logResponseStatus } from '../../../src/components/response-status';

import authMiddleware from '../../../middleware/admin/auth-middleware';
import userPermissionMiddleware from '../../../middleware/admin/admin-user-permission-roll-middleware';
import { permissionBlocks } from '../../../src/constants/permission-blocks';

import LanguagesController from '../../../src/controllers/admin/setup/languages-controller';

const router: Router = express.Router();


router.use(authMiddleware);

router.get('/', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.stores.warehouse, readOnly: 1 }), LanguagesController.findAll);
router.get('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.stores.warehouse, readOnly: 1 }), LanguagesController.findOne);
router.post('/', userPermissionMiddleware({ permissionBlock: permissionBlocks.stores.warehouse, writeOnly: 1 }), logResponseStatus, LanguagesController.create);
router.post('/:id', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.stores.warehouse, writeOnly: 1 }), LanguagesController.update);
router.post('/status-change/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.stores.warehouse, writeOnly: 1 }), LanguagesController.statusChange);
router.delete('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.stores.warehouse }), LanguagesController.destroy);



export default router;

import express, { Request, Response, NextFunction, Router } from 'express';

import { logResponseStatus } from '@components/response-status';

import authMiddleware from '@middleware/admin/auth-middleware';
import userPermissionMiddleware from '@middleware/admin/admin-user-permission-roll-middleware';
import { permissionBlocks } from '@constants/permission-blocks';
import { configureMulter } from '@utils/file-uploads';

import AttributesController from '@controllers/admin/ecommerce/attributes-controller';

const router: Router = express.Router();

const { upload } = configureMulter('attributes', ['itemName']);

router.use(authMiddleware);

router.get('/', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.attributes, readOnly: 1 }), AttributesController.findAll);
router.get('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.attributes, writeOnly: 1 }), AttributesController.findOne);
router.post('/', upload.any(), userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.attributes, readOnly: 1 }), logResponseStatus, AttributesController.create);
router.post('/:id', upload.any(), userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.attributes, writeOnly: 1 }), logResponseStatus, AttributesController.update);
router.delete('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.attributes }), AttributesController.destroy);


export default router;

import express, { Router } from 'express';

import { logResponseStatus } from '@components/response-status';

import authMiddleware from '@middleware/admin/auth-middleware';
import userPermissionMiddleware from '@middleware/admin/admin-user-permission-roll-middleware';
import { permissionBlocks } from '@constants/permission-blocks';

import SpecificationController from '@controllers/admin/ecommerce/specification-controller';

const router: Router = express.Router();

router.use(authMiddleware);

router.get('/', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.specifications, readOnly: 1 }), SpecificationController.findAll);
router.get('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.specifications, writeOnly: 1 }), SpecificationController.findOne);
router.post('/', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.specifications, readOnly: 1 }), logResponseStatus, SpecificationController.create);
router.post('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.specifications, writeOnly: 1 }), logResponseStatus, SpecificationController.update);
router.post('/status-change/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.specifications, writeOnly: 1 }), SpecificationController.statusChange);
router.delete('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.specifications }), SpecificationController.destroy);


export default router;

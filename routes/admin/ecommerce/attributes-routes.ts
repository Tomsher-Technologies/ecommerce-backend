import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';

import authMiddleware from '@middleware/admin/auth-middleware';
import userPermissionMiddleware from '@middleware/admin/admin-user-permission-roll-middleware';
import { logResponseStatus } from '@components/response-status';

import AttributesController from '@controllers/admin/ecommerce/attributes-controller';

const router: Router = express.Router();


router.use(authMiddleware);

router.get('/', logResponseStatus, userPermissionMiddleware({ permissionBlock: 'attributes', readOnly: 1 }), AttributesController.findAll);
router.get('/:id', userPermissionMiddleware({ permissionBlock: 'attributes', writeOnly: 1 }), AttributesController.findOne);
router.post('/', userPermissionMiddleware({ permissionBlock: 'attributes', readOnly: 1 }), logResponseStatus, AttributesController.create);
router.post('/:id', userPermissionMiddleware({ permissionBlock: 'attributes', writeOnly: 1 }), logResponseStatus, AttributesController.update);
router.delete('/:id', userPermissionMiddleware({ permissionBlock: 'attributes' }), AttributesController.destroy);


export default router;

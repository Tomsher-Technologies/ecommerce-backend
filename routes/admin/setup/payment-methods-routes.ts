import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';

import { configureMulter } from '../../../src/utils/file-uploads';
import authMiddleware from '../../../middleware/admin/auth-middleware';
import userPermissionMiddleware from '../../../middleware/admin/admin-user-permission-roll-middleware';
import { logResponseStatus } from '../../../src/components/response-status';

import { permissionBlocks } from '../../../src/constants/permission-blocks';
import PaymentMethodController from '../../../src/controllers/admin/setup/payment-methods-controller';

const router: Router = express.Router();

const { upload } = configureMulter('paymentMethod', ['paymentMethodImage',]);

router.use(authMiddleware);

router.get('/', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.paymentMethod, readOnly: 1 }), PaymentMethodController.findAll);
router.get('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.paymentMethod, readOnly: 1 }), PaymentMethodController.findOne);
router.post('/', upload.single('paymentMethodImage'), userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.paymentMethod, writeOnly: 1 }), logResponseStatus, PaymentMethodController.create);
router.post('/:id', upload.single('paymentMethodImage'), logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.paymentMethod, writeOnly: 1 }), PaymentMethodController.update);
router.post('/status-change/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.paymentMethod, writeOnly: 1 }), PaymentMethodController.statusChange);
// router.delete('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.paymentMethod }), PaymentMethodController.destroy);


export default router;

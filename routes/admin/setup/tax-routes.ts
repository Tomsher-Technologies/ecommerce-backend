import express, { Router } from 'express';

import { logResponseStatus } from '../../../src/components/response-status';

import authMiddleware from '../../../middleware/admin/auth-middleware';
import userPermissionMiddleware from '../../../middleware/admin/admin-user-permission-roll-middleware';
import { permissionBlocks } from '../../../src/constants/permission-blocks';

import TaxsController from '../../../src/controllers/admin/setup/tax-controller';

const router: Router = express.Router();

router.use(authMiddleware);

router.get('/', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.tax, readOnly: 1 }), TaxsController.findAll);
router.get('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.tax, readOnly: 1 }), TaxsController.findOne);
router.post('/', userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.tax, writeOnly: 1 }), logResponseStatus, TaxsController.create);
router.post('/:id', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.tax, writeOnly: 1 }), TaxsController.update);
router.post('/status-change/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.tax, writeOnly: 1 }), TaxsController.statusChange);
router.delete('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.tax }), TaxsController.destroy);

export default router;

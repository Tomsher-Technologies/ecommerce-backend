import express, { Router } from 'express';

import authMiddleware from '../../../middleware/admin/auth-middleware';
import userPermissionMiddleware from '../../../middleware/admin/admin-user-permission-roll-middleware';
import { permissionBlocks } from '../../../src/constants/permission-blocks';

import ContactUsService from '../../../src/controllers/admin/customer/contact-us-controller';

const router: Router = express.Router();

router.use(authMiddleware);

router.get('/', userPermissionMiddleware({ permissionBlock: permissionBlocks.customers.contactus, readOnly: 1 }), ContactUsService.findAll);
router.get('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.customers.contactus, readOnly: 1 }), ContactUsService.findOne);

export default router;

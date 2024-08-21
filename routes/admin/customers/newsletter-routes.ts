import express, { Router } from 'express';

import authMiddleware from '../../../middleware/admin/auth-middleware';
import userPermissionMiddleware from '../../../middleware/admin/admin-user-permission-roll-middleware';
import { permissionBlocks } from '../../../src/constants/permission-blocks';

import NewsletterService from '../../../src/controllers/admin/customer/newsletter-controller';

const router: Router = express.Router();

router.use(authMiddleware);

router.get('/', userPermissionMiddleware({ permissionBlock: permissionBlocks.customers.newsletter, readOnly: 1 }), NewsletterService.findAll);
router.get('/export', NewsletterService.exportNewsletter);

export default router;

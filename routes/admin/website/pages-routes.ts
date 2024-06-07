import express, { Router } from 'express';

import { configureMulter } from '../../../src/utils/file-uploads';
import authMiddleware from '../../../middleware/admin/auth-middleware';
import userPermissionMiddleware from '../../../middleware/admin/admin-user-permission-roll-middleware';
import { permissionBlocks } from '../../../src/constants/permission-blocks';

import PagesController from '../../../src/controllers/admin/website/pages-controller';

const router: Router = express.Router();
const { upload } = configureMulter('basicsettings', ['multiFiles',]);

router.use(authMiddleware);

router.get('/find-with-country-id/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.websitesetups, readOnly: 1 }), PagesController.findOneWithCountryId);
router.post('/manage-with-country-id/:id', upload.any(), userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.websitesetups, readOnly: 1 }), PagesController.manageWithCountryId);

export default router;

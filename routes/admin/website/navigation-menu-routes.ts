import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';

import { logResponseStatus } from '../../../src/components/response-status';
import { configureMulter } from '../../../src/utils/file-uploads';
import authMiddleware from '../../../middleware/admin/auth-middleware';
import userPermissionMiddleware from '../../../middleware/admin/admin-user-permission-roll-middleware';
import { permissionBlocks } from '../../../src/constants/permission-blocks';

import NavigationMenuController from '../../../src/controllers/admin/website/navigation-menu-controller';


const router: Router = express.Router();
const { upload } = configureMulter('navigationmenu', ['multiFiles',]);

router.use(authMiddleware);

router.get('/', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.website.navigationMenu, readOnly: 1 }), NavigationMenuController.findAll);
router.get('/find-with-country-id/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.website.navigationMenu, readOnly: 1 }), NavigationMenuController.findOneWithCountryId);
router.post('/manage-with-country-id/:id', upload.any(), userPermissionMiddleware({ permissionBlock: permissionBlocks.website.navigationMenu, readOnly: 1 }), NavigationMenuController.manageWithCountryId);


router.use((err: any, req: Request, res: Response, next: NextFunction) => {
    // Check if the error is from multer
    if (err instanceof multer.MulterError) {
        console.error('Multer Error:', err);
        res.status(400).send('File upload error: ' + err.message);
    } else {
        console.error(err.stack);
        res.status(500).send('Something broke!');
    }
});


export default router;

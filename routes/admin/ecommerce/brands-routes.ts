import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';

import { logResponseStatus } from '../../../src/components/response-status';

import userPermissionMiddleware from '../../../middleware/admin/admin-user-permission-roll-middleware';
import authMiddleware from '../../../middleware/admin/auth-middleware';
import { configureMulter } from '../../../src/utils/file-uploads';
import { permissionBlocks } from '../../../src/constants/permission-blocks';

import BrandsController from '../../../src/controllers/admin/ecommerce/brands-controller';

const router: Router = express.Router();

const { upload } = configureMulter('brand', ['brandImage','brandBannerImage']);

router.use(authMiddleware);

router.get('/', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.brands, readOnly: 1 }), BrandsController.findAll);
router.get('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.brands, writeOnly: 1 }), BrandsController.findOne);
router.post('/', upload.any(), userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.brands, readOnly: 1 }), logResponseStatus, BrandsController.create);
router.post('/:id', upload.any(), userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.brands, writeOnly: 1 }), logResponseStatus, BrandsController.update);
router.post('/website/update-website-priority', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.brands, writeOnly: 1 }), logResponseStatus, BrandsController.updateWebsitePriority);
router.post('/status-change/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.brands, writeOnly: 1 }), BrandsController.statusChange);
router.delete('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.brands}), BrandsController.destroy);


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

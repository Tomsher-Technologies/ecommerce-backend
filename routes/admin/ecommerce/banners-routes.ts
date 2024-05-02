import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';

import { logResponseStatus } from '@components/response-status';

import { configureMulter } from '@utils/file-uploads';
import authMiddleware from '@middleware/admin/auth-middleware';
import userPermissionMiddleware from '@middleware/admin/admin-user-permission-roll-middleware';
import { permissionBlocks } from '@constants/permission-blocks';

import BannerController from '@controllers/admin/ecommerce/banner-controller';

const router: Router = express.Router();

const { upload } = configureMulter('banner', ['bannerImage',]);

router.use(authMiddleware);

router.get('/', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.banners, readOnly: 1 }), BannerController.findAll);
router.get('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.banners, writeOnly: 1 }), BannerController.findOne);
router.post('/', upload.any(), userPermissionMiddleware({ permissionBlock: permissionBlocks.banners, readOnly: 1 }), logResponseStatus, BannerController.create);
router.post('/:id', upload.any(), userPermissionMiddleware({ permissionBlock: permissionBlocks.banners, writeOnly: 1 }), logResponseStatus, BannerController.update);
router.post('/status-change/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.banners, writeOnly: 1 }), BannerController.statusChange);
router.post('/position-change/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.banners, writeOnly: 1 }), BannerController.positionChange);
router.delete('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.banners, deleteOnly: 1 }), BannerController.destroy);


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

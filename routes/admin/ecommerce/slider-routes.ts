import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';

import { logResponseStatus } from '@components/response-status';

import { configureMulter } from '@utils/file-uploads';
import authMiddleware from '@middleware/admin/auth-middleware';
import userPermissionMiddleware from '@middleware/admin/admin-user-permission-roll-middleware';
import { permissionBlocks } from '@constants/permission-blocks';

import SlidersController from '@controllers/admin/ecommerce/sliders-controller';

const router: Router = express.Router();

const { upload } = configureMulter('slider', ['sliderImage',]);

router.use(authMiddleware);

router.get('/', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.sliders, readOnly: 1 }), SlidersController.findAll);
router.get('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.sliders, readOnly: 1 }), SlidersController.findOne);
router.post('/', upload.any(), userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.sliders, readOnly: 1 }), logResponseStatus, SlidersController.create);
router.post('/:id', upload.any(), userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.sliders, writeOnly: 1 }), logResponseStatus, SlidersController.update);
router.post('/status-change/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.sliders, writeOnly: 1 }), SlidersController.statusChange);
router.post('/position-change/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.sliders, writeOnly: 1 }), SlidersController.positionChange);
router.delete('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.sliders, deleteOnly: 1 }), SlidersController.destroy);


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

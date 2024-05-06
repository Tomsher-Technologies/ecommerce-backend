import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';

import { logResponseStatus } from '@components/response-status';
import authMiddleware from '@middleware/admin/auth-middleware';
import { configureMulter } from '@utils/file-uploads';
import { permissionBlocks } from '@constants/permission-blocks';

import CollectionsProductsController from '@controllers/admin/website/collections-products-controller';
import userPermissionMiddleware from '@middleware/admin/admin-user-permission-roll-middleware';

const router: Router = express.Router();

const { upload } = configureMulter('collection', ['collectionImage',]);

router.use(authMiddleware);

router.get('/', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.website.collectionsProducts, readOnly: 1 }), CollectionsProductsController.findAll);
router.get('/:id', CollectionsProductsController.findOne);
router.post('/', upload.any(), logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.website.collectionsProducts, readOnly: 1 }), CollectionsProductsController.create);
router.post('/:id', upload.any(), logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.website.collectionsProducts, readOnly: 1 }), CollectionsProductsController.update);
router.delete('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.website.collectionsProducts }), CollectionsProductsController.destroy);


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

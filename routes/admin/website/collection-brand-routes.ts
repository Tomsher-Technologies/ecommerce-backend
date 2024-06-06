import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';

import { logResponseStatus } from '../../../src/components/response-status';
import authMiddleware from '../../../middleware/admin/auth-middleware';
import userPermissionMiddleware from '../../../middleware/admin/admin-user-permission-roll-middleware';
import { configureMulter } from '../../../src/utils/file-uploads';
import { permissionBlocks } from '../../../src/constants/permission-blocks';

import CollectionsBrandsController from '../../../src/controllers/admin/website/collections-brands-controller';

const router: Router = express.Router();

const { upload } = configureMulter('collection', ['collectionImage',]);

router.use(authMiddleware);

router.get('/', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.website.collectionsBrands, readOnly: 1 }), CollectionsBrandsController.findAll);
router.get('/:id', CollectionsBrandsController.findOne);
router.post('/', upload.any(), logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.website.collectionsBrands, readOnly: 1 }), CollectionsBrandsController.create);
router.post('/:id', upload.any(), logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.website.collectionsBrands, readOnly: 1 }), CollectionsBrandsController.update);
router.delete('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.website.collectionsBrands }), CollectionsBrandsController.destroy);


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

import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';

import { logResponseStatus } from '../../../src/components/response-status';
import authMiddleware from '../../../middleware/admin/auth-middleware';
import userPermissionMiddleware from '../../../middleware/admin/admin-user-permission-roll-middleware';
import { configureMulter } from '../../../src/utils/file-uploads';
import { permissionBlocks } from '../../../src/constants/permission-blocks';

import CollectionsCategoriesController from '../../../src/controllers/admin/website/collections-categories-controller';

const router: Router = express.Router();

const { upload } = configureMulter('collection', ['collectionImage',]);

router.use(authMiddleware);

router.get('/', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.website.collectionsCategories, readOnly: 1 }), CollectionsCategoriesController.findAll);
router.get('/:id', CollectionsCategoriesController.findOne);
router.post('/', upload.any(), logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.website.collectionsCategories, readOnly: 1 }), CollectionsCategoriesController.create);
router.post('/:id', upload.any(), logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.website.collectionsCategories, readOnly: 1 }), CollectionsCategoriesController.update);
router.delete('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.website.collectionsCategories }), CollectionsCategoriesController.destroy);


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

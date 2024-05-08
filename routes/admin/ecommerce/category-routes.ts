import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';

import { configureMulter } from '@utils/file-uploads';
import authMiddleware from '@middleware/admin/auth-middleware';
import userPermissionMiddleware from '@middleware/admin/admin-user-permission-roll-middleware';
import { logResponseStatus } from '@components/response-status';

import CategoryController from '@controllers/admin/ecommerce/category-controller';
import { permissionBlocks } from '@constants/permission-blocks';

const router: Router = express.Router();

const { upload } = configureMulter('category', ['categoryImage',]);

router.use(authMiddleware);

router.get('/', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.categories, readOnly: 1 }), CategoryController.findAll);
router.get('/parent-categories', logResponseStatus, CategoryController.findAllParentCategories);
router.get('/categories', logResponseStatus, CategoryController.findAllCategories);
router.get('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.categories, readOnly: 1 }), CategoryController.findOne);
router.post('/', upload.any(), logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.categories, readOnly: 1 }), CategoryController.create);
router.post('/:id', upload.any(), logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.categories, writeOnly: 1 }), CategoryController.update);
router.post('/status-change/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.categories, writeOnly: 1 }), CategoryController.statusChange);
router.post('/website/update-website-priority', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.categories, writeOnly: 1 }), CategoryController.updateWebsitePriority);
router.delete('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.ecommerce.categories }), CategoryController.destroy);


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

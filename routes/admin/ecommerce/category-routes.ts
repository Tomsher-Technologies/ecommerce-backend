import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';

import { configureMulter } from '@utils/file-uploads';
import authMiddleware from '@middleware/auth-middleware';
import { logResponseStatus } from '@components/response-status';

import CategoryController from '@controllers/admin/ecommerce/category-controller';
import userPermissionMiddleware from '@middleware/admin-user-permission-roll-middleware';

const router: Router = express.Router();

const { upload } = configureMulter('category', ['categoryImage',]);

router.use(authMiddleware);

router.get('/', logResponseStatus, userPermissionMiddleware({ permissionBlock: 'category', readOnly: 1 }), CategoryController.findAll);
router.get('/parent-categories', logResponseStatus, CategoryController.findAllParentCategories);
router.get('/:id', CategoryController.findOne);
router.post('/', upload.single('categoryImage'), logResponseStatus, CategoryController.create);
router.post('/:id', upload.single('categoryImage'), logResponseStatus, CategoryController.update);
router.post('/website/update-website-priority', logResponseStatus, CategoryController.updateWebsitePriority);
router.delete('/:id', CategoryController.destroy);


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

import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';

import { logResponseStatus } from '@components/response-status';
import authMiddleware from '@middleware/auth-middleware';
import { configureMulter } from '@utils/file-uploads';

import CollectionsProductsController from '@controllers/admin/website/collections-products-controller';

const router: Router = express.Router();

const { upload } = configureMulter('collection', ['collectionImage',]);

router.use(authMiddleware);

router.get('/', logResponseStatus, CollectionsProductsController.findAll);
router.get('/:id', CollectionsProductsController.findOne);
router.post('/', upload.single('collectionImage'), logResponseStatus, CollectionsProductsController.create);
router.post('/:id', upload.single('collectionImage'), logResponseStatus, CollectionsProductsController.update);
router.delete('/:id', CollectionsProductsController.destroy);


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

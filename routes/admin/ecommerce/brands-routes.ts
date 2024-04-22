import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';

import { configureMulter } from '@utils/file-uploads';
import authMiddleware from '@middleware/auth-middleware';
import { logResponseStatus } from '@components/response-status';

import BrandsController from '@controllers/admin/ecommerce/brands-controller';

const router: Router = express.Router();

const { upload } = configureMulter('brand', ['brandImage',]);

router.use(authMiddleware);

router.get('/', logResponseStatus, BrandsController.findAll);
router.get('/:id', BrandsController.findOne);
router.post('/', upload.single('brandImage'), logResponseStatus, BrandsController.create);
router.post('/:id', upload.single('brandImage'), logResponseStatus, BrandsController.update);
router.post('/website/update-website-priority', logResponseStatus, BrandsController.updateWebsitePriority);
router.delete('/:id', BrandsController.destroy);


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

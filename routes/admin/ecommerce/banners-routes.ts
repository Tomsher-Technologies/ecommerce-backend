import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';

import { configureMulter } from '@utils/file-uploads';
import authMiddleware from '@middleware/auth-middleware';
import { logResponseStatus } from '@components/response-status';

import BannerController from '@controllers/admin/ecommerce/banner-controller';

const router: Router = express.Router();

const { upload } = configureMulter('banner', ['bannerImage',]);

router.use(authMiddleware);

router.get('/', logResponseStatus, BannerController.findAll);
router.get('/:id', BannerController.findOne);
router.post('/', upload.single('bannerImage'), logResponseStatus, BannerController.create);
router.post('/:id', upload.single('bannerImage'), logResponseStatus, BannerController.update);
router.delete('/:id', BannerController.destroy);


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

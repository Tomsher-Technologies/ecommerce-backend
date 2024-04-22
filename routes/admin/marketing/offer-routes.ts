import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';

import { logResponseStatus } from '@components/response-status';
import authMiddleware from '@middleware/auth-middleware';
import { configureMulter } from '@utils/file-uploads';

import OffersController from '@controllers/admin/marketing/offers-controller';

const router: Router = express.Router();

const { upload } = configureMulter('offer', ['offerImage',]);

router.use(authMiddleware);

router.get('/', logResponseStatus, OffersController.findAll);
router.get('/:id', OffersController.findOne);
router.post('/', upload.single('offerImage'), logResponseStatus, OffersController.create);
router.post('/:id', upload.single('offerImage'), logResponseStatus, OffersController.update);
router.delete('/:id', OffersController.destroy);


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

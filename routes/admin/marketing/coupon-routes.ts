import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';

import authMiddleware from '@middleware/auth-middleware';
import { logResponseStatus } from '@components/response-status';

import CouponsController from '@controllers/admin/marketing/coupons-controller';

const router: Router = express.Router();


router.use(authMiddleware);

router.get('/', logResponseStatus, CouponsController.findAll);
router.get('/:id', CouponsController.findOne);
router.post('/', logResponseStatus, CouponsController.create);
router.post('/:id', logResponseStatus, CouponsController.update);
router.delete('/:id', CouponsController.destroy);


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

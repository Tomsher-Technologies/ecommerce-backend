import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';

import { configureMulter } from '@utils/file-uploads';
import { logResponseStatus } from '@components/response-status';
import authMiddleware from '@middleware/admin/auth-middleware';
import userPermissionMiddleware from '@middleware/admin/admin-user-permission-roll-middleware';

import OffersController from '@controllers/admin/marketing/offers-controller';

const router: Router = express.Router();

const { upload } = configureMulter('offer', ['offerImage',]);

router.use(authMiddleware);

router.get('/', logResponseStatus, userPermissionMiddleware({ permissionBlock: 'offers', readOnly: 1 }), OffersController.findAll);
router.get('/:id', userPermissionMiddleware({ permissionBlock: 'offers', readOnly: 1 }), OffersController.findOne);
router.post('/', upload.single('offerImage'), userPermissionMiddleware({ permissionBlock: 'offers', writeOnly: 1 }), logResponseStatus, OffersController.create);
router.post('/:id', upload.single('offerImage'), userPermissionMiddleware({ permissionBlock: 'offers', writeOnly: 1 }), logResponseStatus, OffersController.update);
router.delete('/:id', userPermissionMiddleware({ permissionBlock: 'offers' }), OffersController.destroy);


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

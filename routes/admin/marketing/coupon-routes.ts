import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';

import { logResponseStatus } from '../../../src/components/response-status';
import authMiddleware from '../../../middleware/admin/auth-middleware';
import userPermissionMiddleware from '../../../middleware/admin/admin-user-permission-roll-middleware';
import { permissionBlocks } from '../../../src/constants/permission-blocks';

import CouponsController from '../../../src/controllers/admin/marketing/coupons-controller';

const router: Router = express.Router();


router.use(authMiddleware);

router.get('/', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.marketing.coupons, readOnly: 1 }), CouponsController.findAll);
router.get('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.marketing.coupons, readOnly: 1 }), CouponsController.findOne);
router.post('/', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.marketing.coupons, writeOnly: 1 }), CouponsController.create);
router.post('/:id', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.marketing.coupons, writeOnly: 1 }), CouponsController.update);
router.post('/position-change/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.marketing.coupons, writeOnly: 1 }), CouponsController.statusChange);
router.delete('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.marketing.coupons }), CouponsController.destroy);


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

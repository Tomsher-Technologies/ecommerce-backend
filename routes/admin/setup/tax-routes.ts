import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';

import { logResponseStatus } from '../../../src/components/response-status';

import authMiddleware from '../../../middleware/admin/auth-middleware';
import userPermissionMiddleware from '../../../middleware/admin/admin-user-permission-roll-middleware';
import { permissionBlocks } from '../../../src/constants/permission-blocks';

import TaxsController from '../../../src/controllers/admin/setup/tax-controller';

const router: Router = express.Router();


router.use(authMiddleware);

router.get('/', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.taxs, readOnly: 1 }), TaxsController.findAll);
router.get('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.taxs, readOnly: 1 }), TaxsController.findOne);
router.post('/', userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.taxs, writeOnly: 1 }), logResponseStatus, TaxsController.create);
router.post('/:id', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.taxs, writeOnly: 1 }), TaxsController.update);
router.post('/status-change/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.taxs, writeOnly: 1 }), TaxsController.statusChange);
router.delete('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.taxs }), TaxsController.destroy);

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

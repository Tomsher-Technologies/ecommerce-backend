import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';

import authMiddleware from '@middleware/admin/auth-middleware';
import { logResponseStatus } from '@components/response-status';

import userPermissionMiddleware from '@middleware/admin/admin-user-permission-roll-middleware';
import languagesController from '@controllers/admin/setup/languages-controller';

const router: Router = express.Router();


router.use(authMiddleware);

router.get('/', logResponseStatus, userPermissionMiddleware({ permissionBlock: 'languages', readOnly: 1 }), languagesController.findAll);
router.get('/:id', userPermissionMiddleware({ permissionBlock: 'languages', readOnly: 1 }), languagesController.findOne);
router.post('/', userPermissionMiddleware({ permissionBlock: 'languages', writeOnly: 1 }), logResponseStatus, languagesController.create);
router.post('/:id', logResponseStatus, userPermissionMiddleware({ permissionBlock: 'languages', writeOnly: 1 }), languagesController.update);
router.delete('/:id', userPermissionMiddleware({ permissionBlock: 'languages' }), languagesController.destroy);

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

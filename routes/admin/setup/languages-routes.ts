import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';

import { logResponseStatus } from '@components/response-status';

import authMiddleware from '@middleware/admin/auth-middleware';
import { permissionBlocks } from '@constants/permission-blocks';

import userPermissionMiddleware from '@middleware/admin/admin-user-permission-roll-middleware';
import LanguagesController from '@controllers/admin/setup/languages-controller';

const router: Router = express.Router();


router.use(authMiddleware);

router.get('/', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.languages, readOnly: 1 }), LanguagesController.findAll);
router.get('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.languages, readOnly: 1 }), LanguagesController.findOne);
router.post('/', userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.languages, writeOnly: 1 }), logResponseStatus, LanguagesController.create);
router.post('/:id', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.languages, writeOnly: 1 }), LanguagesController.update);
router.post('/status-change/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.languages, writeOnly: 1 }), LanguagesController.statusChange);
router.delete('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.languages }), LanguagesController.destroy);

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

import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';

import { configureMulter } from '@utils/file-uploads';
import authMiddleware from '@middleware/admin/auth-middleware';
import { logResponseStatus } from '@components/response-status';

import CountryController from '@controllers/admin/setup/country-controller';
import userPermissionMiddleware from '@middleware/admin/admin-user-permission-roll-middleware';
import { permissionBlocks } from '@constants/permission-blocks';

const router: Router = express.Router();

const { upload } = configureMulter('country', ['countryImage',]);

router.use(authMiddleware);

router.get('/', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.country, readOnly: 1 }), CountryController.findAll);
router.get('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.country, readOnly: 1 }), CountryController.findOne);
router.post('/', upload.single('countryImage'), userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.country, writeOnly: 1 }), logResponseStatus, CountryController.create);
router.post('/:id', upload.single('countryImage'), logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.country, writeOnly: 1 }), CountryController.update);
router.post('/status-change/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.country, writeOnly: 1 }), CountryController.statusChange);
router.delete('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.setup.country }), CountryController.destroy);

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

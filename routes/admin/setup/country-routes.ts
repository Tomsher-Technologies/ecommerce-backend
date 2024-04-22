import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';

import { configureMulter } from '@utils/file-uploads';
import authMiddleware from '@middleware/auth-middleware';
import { logResponseStatus } from '@components/response-status';

import CountryController from '@controllers/admin/setup/country-controller';

const router: Router = express.Router();

const { upload } = configureMulter('country', ['countryImage',]);

router.use(authMiddleware);

router.get('/', logResponseStatus, CountryController.findAll);
router.get('/:id', CountryController.findOne);
router.post('/', upload.single('countryImage'), logResponseStatus, CountryController.create);
router.post('/:id', upload.single('countryImage'), logResponseStatus, CountryController.update);
router.delete('/:id', CountryController.destroy);


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

import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';

import { logResponseStatus } from '../../src/components/response-status';

import HomeController from '../../src/controllers/frontend/common-controller';

const router: Router = express.Router();

// router.get('/slider', logResponseStatus, HomeController.findAllSliders);
// router.get('/banner', HomeController.findAllBanners);

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

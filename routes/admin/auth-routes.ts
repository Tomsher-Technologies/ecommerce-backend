import 'module-alias/register';
import express, { Request, Response, NextFunction, Router } from 'express';
import helmet from 'helmet';

import AuthController from '@controllers/admin/auth';

const router: Router = express.Router();

router.use(helmet());

// Parse incoming JSON bodies
router.use(express.json());

// Parse incoming URL-encoded bodies
router.use(express.urlencoded({ extended: true }));

router.post('/login', AuthController.login);

router.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});


export default router;




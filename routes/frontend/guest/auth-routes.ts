import 'module-alias/register';
import express, { Request, Response, NextFunction, Router } from 'express';
import helmet from 'helmet';

import GuestController from '../../../src/controllers/frontend/guest/guest-controller';

const router: Router = express.Router();

router.use(helmet());

router.use(express.json());

router.use(express.urlencoded({ extended: true }));


router.post('/register', GuestController.register);
router.post('/login', GuestController.login);
router.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

export default router;

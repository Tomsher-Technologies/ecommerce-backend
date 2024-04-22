import 'module-alias/register';
import express, { Request, Response, NextFunction, Router } from 'express';
import helmet from 'helmet';

import authMiddleware from '@middleware/auth-middleware';
import PrivilagesController from '@controllers/admin/account/privilages-controller';

const router: Router = express.Router();

router.use(helmet());

router.use(express.json());

router.use(express.urlencoded({ extended: true }));

router.use(authMiddleware);


router.get('/', PrivilagesController.findAll);
router.get('/:id', PrivilagesController.findOne);
router.post('/', PrivilagesController.create);

router.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

export default router;

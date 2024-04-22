import 'module-alias/register';
import express, { Request, Response, NextFunction, Router } from 'express';
import helmet from 'helmet';

import authMiddleware from '@middleware/auth-middleware';
import UserTypeController from '@controllers/admin/account/user-types-controller';

const router: Router = express.Router();

router.use(helmet());

router.use(express.json());

router.use(express.urlencoded({ extended: true }));

router.use(authMiddleware);


router.get('/', UserTypeController.findAll);
router.get('/:id', UserTypeController.findOne);
router.post('/', UserTypeController.create);
router.post('/:id', UserTypeController.update);
router.delete('/:id', UserTypeController.destroy);

router.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

export default router;

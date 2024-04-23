import 'module-alias/register';
import express, { Request, Response, NextFunction, Router } from 'express';
import helmet from 'helmet';

import authMiddleware from '@middleware/admin/auth-middleware';
import UserTypeController from '@controllers/admin/account/user-types-controller';
import userPermissionMiddleware from '@middleware/admin/admin-user-permission-roll-middleware';

const router: Router = express.Router();

router.use(helmet());

router.use(express.json());

router.use(express.urlencoded({ extended: true }));

router.use(authMiddleware);


router.get('/', userPermissionMiddleware({ permissionBlock: 'users', readOnly: 1 }), UserTypeController.findAll);
router.get('/:id', userPermissionMiddleware({ permissionBlock: 'users', readOnly: 1 }), UserTypeController.findOne);
router.post('/', userPermissionMiddleware({ permissionBlock: 'users', writeOnly: 1 }), UserTypeController.create);
router.post('/:id', userPermissionMiddleware({ permissionBlock: 'users', writeOnly: 1 }), UserTypeController.update);
router.delete('/:id', userPermissionMiddleware({ permissionBlock: 'users' }), UserTypeController.destroy);

router.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

export default router;

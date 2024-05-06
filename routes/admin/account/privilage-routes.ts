import 'module-alias/register';
import express, { Request, Response, NextFunction, Router } from 'express';
import helmet from 'helmet';

import authMiddleware from '@middleware/admin/auth-middleware';
import userPermissionMiddleware from '@middleware/admin/admin-user-permission-roll-middleware';
import { permissionBlocks } from '@constants/permission-blocks';

import PrivilagesController from '@controllers/admin/account/privilages-controller';

const router: Router = express.Router();

router.use(helmet());

router.use(express.json());

router.use(express.urlencoded({ extended: true }));

router.use(authMiddleware);


router.get('/', userPermissionMiddleware({ permissionBlock: permissionBlocks.account.privilages, readOnly: 1 }), PrivilagesController.findAll);
router.get('/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.account.privilages, readOnly: 1 }), PrivilagesController.findOne);
router.post('/manage-privilage/:id', userPermissionMiddleware({ permissionBlock: permissionBlocks.account.privilages, writeOnly: 1 }), PrivilagesController.managePrivilage);

router.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

export default router;

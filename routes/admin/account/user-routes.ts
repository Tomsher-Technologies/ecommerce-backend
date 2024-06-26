import 'module-alias/register';
import express, { Request, Response, NextFunction, Router } from 'express';
import helmet from 'helmet';

import { logResponseStatus } from '../../../src/components/response-status';

import { configureMulter } from '../../../src/utils/file-uploads';
import authMiddleware from '../../../middleware/admin/auth-middleware';
import userPermissionMiddleware from '../../../middleware/admin/admin-user-permission-roll-middleware';
import { permissionBlocks } from '../../../src/constants/permission-blocks';

import UserController from '../../../src/controllers/admin/account/users-controller';

const router: Router = express.Router();

// Apply Helmet middleware for enhanced security
router.use(helmet());

const { upload } = configureMulter('user', ['userImage',]);

// Apply authentication middleware
router.use(authMiddleware);

// Define routes
// .get(UserController.findAll)
// .post(UserController.create)
// .post(UserController.update)
// .delete(UserController.destroy);
router.get('/', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.account.users, readOnly: 1 }), UserController.findAll);
router.get('/:id', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.account.users, readOnly: 1 }), UserController.findOne);
router.post('/', upload.single('userImage'), userPermissionMiddleware({ permissionBlock: permissionBlocks.account.users, writeOnly: 1 }), logResponseStatus, UserController.create);
router.post('/:id', upload.single('userImage'), userPermissionMiddleware({ permissionBlock: permissionBlocks.account.users, writeOnly: 1 }), logResponseStatus, UserController.update);
router.delete('/:id', logResponseStatus, userPermissionMiddleware({ permissionBlock: permissionBlocks.account.users }), UserController.destroy);

// Error handling middleware
router.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

export default router;

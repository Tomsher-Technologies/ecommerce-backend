import 'module-alias/register';
import express, { Request, Response, NextFunction, Router } from 'express';
import helmet from 'helmet';

import { logResponseStatus } from '@components/response-status';

import { configureMulter } from '@utils/file-uploads';

import UserController from '@controllers/admin/account/users-controller';
import authMiddleware from '@middleware/auth-middleware';

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
router.get('/', logResponseStatus, UserController.findAll);
router.get('/:id', logResponseStatus, UserController.findOne);
router.post('/', upload.single('userImage'), logResponseStatus, UserController.create);
router.post('/:id', upload.single('userImage'), logResponseStatus, UserController.update);
router.delete('/:id', logResponseStatus, UserController.destroy);

// Error handling middleware
router.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

export default router;

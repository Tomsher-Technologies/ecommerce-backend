import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';

import authMiddleware from '@middleware/auth-middleware';
import { logResponseStatus } from '@components/response-status';

import AttributesController from '@controllers/admin/ecommerce/attributes-controller';

const router: Router = express.Router();


router.use(authMiddleware);

router.get('/', logResponseStatus, AttributesController.findAll);
router.get('/:id', AttributesController.findOne);
router.post('/',  logResponseStatus, AttributesController.create);
router.post('/:id',  logResponseStatus, AttributesController.update);
router.delete('/:id', AttributesController.destroy);


export default router;

import express, { Router } from 'express';

import { logResponseStatus } from '../../../src/components/response-status';

import ProductController from '../../../src/controllers/frontend/guest/product-controller';

const router: Router = express.Router();

router.get('/', logResponseStatus, ProductController.findAllAttributes);

export default router;

import express, { Router } from 'express';

import { logResponseStatus } from '../../../src/components/response-status';

import CategoryController from '../../../src/controllers/frontend/guest/category-controller';

const router: Router = express.Router();

router.get('/', logResponseStatus, CategoryController.findAll);

export default router;

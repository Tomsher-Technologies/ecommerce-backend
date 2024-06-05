import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';

import { logResponseStatus } from '../../src/components/response-status';

import CommonController from '../../src/controllers/frontend/common-controller';

const router: Router = express.Router();

router.get('/slider', logResponseStatus, CommonController.findAllSliders);
router.get('/banner', CommonController.findAllBanners);
router.get('/website-setups', CommonController.findWebsiteSetups);
router.get('/website-setups', CommonController.findWebsiteSetups);
router.get('/priority-product', CommonController.findPriorityProducts);
router.get('/collection-products', CommonController.findCollectionProducts);
router.get('/collection-categories', CommonController.findCollectionProducts);



export default router;

import express, {  Router } from 'express';

import { logResponseStatus } from '../../../src/components/response-status';

import CommonController from '../../../src/controllers/frontend/guest/common-controller';

const router: Router = express.Router();

router.get('/slider', logResponseStatus, CommonController.findAllSliders);
router.get('/banner', CommonController.findAllBanners);
router.get('/website-setups', CommonController.findWebsiteSetups);
router.get('/website-setups', CommonController.findWebsiteSetups);
router.get('/priority-product', CommonController.findPriorityProducts);
router.get('/collection-products', CommonController.findCollectionProducts);
router.get('/collection-categories', CommonController.findCollectionCategories);
router.get('/collection-brands', CommonController.findCollectionBrands);



export default router;

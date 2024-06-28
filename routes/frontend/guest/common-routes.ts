import express, {  Router } from 'express';

import { logResponseStatus } from '../../../src/components/response-status';

import CommonController from '../../../src/controllers/frontend/guest/common-controller';
import checkoutController from '../../../src/controllers/frontend/auth/checkout';
const router: Router = express.Router();

router.get('/countries', logResponseStatus, CommonController.findAllCountries);
router.get('/slider', logResponseStatus, CommonController.findAllSliders);
router.get('/banner', CommonController.findAllBanners);
router.get('/website-setups', CommonController.findWebsiteSetups);
router.get('/priority-product', CommonController.findPriorityProducts);
router.get('/collection-products', CommonController.findCollectionProducts);
router.get('/collection-categories', CommonController.findCollectionCategories);
router.get('/collection-brands', CommonController.findCollectionBrands);
router.get('/payment-methods', CommonController.findPaymentMethods);
router.get('/stores', CommonController.findAllStores);
router.get('/tap-success-response', logResponseStatus, checkoutController.tapSuccessResponse);
router.get('/tap-failure-response', logResponseStatus, checkoutController.tapSuccessResponse);
router.post('/tap-success-response', logResponseStatus, checkoutController.tapSuccessResponse);
router.post('/tap-failure-response', logResponseStatus, checkoutController.tapSuccessResponse);

export default router;

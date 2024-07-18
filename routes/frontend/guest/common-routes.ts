import express, {  Router } from 'express';

import { logResponseStatus } from '../../../src/components/response-status';

import CommonController from '../../../src/controllers/frontend/guest/common-controller';
import checkoutController from '../../../src/controllers/frontend/auth/checkout-controller';
const router: Router = express.Router();

router.get('/countries', CommonController.findAllCountries);
router.get('/slider', CommonController.findAllSliders);
router.get('/banner', CommonController.findAllBanners);
router.get('/website-setups', CommonController.findWebsiteSetups);
router.get('/priority-product', CommonController.findPriorityProducts);
router.get('/collection-products', CommonController.findCollectionProducts);
router.get('/collection-categories', CommonController.findCollectionCategories);
router.get('/collection-brands', CommonController.findCollectionBrands);
router.get('/payment-methods', CommonController.findPaymentMethods);
router.get('/stores', CommonController.findAllStores);

router.get('/tap-success-response', checkoutController.tapSuccessResponse);
router.get('/tap-failure-response', checkoutController.tapSuccessResponse);

router.get('/tabby-success-response', checkoutController.tabbySuccessResponse);
router.get('/tabby-failure-response', checkoutController.tabbySuccessResponse);

router.get('/network-payment-response', checkoutController.networkPaymentResponse);

export default router;

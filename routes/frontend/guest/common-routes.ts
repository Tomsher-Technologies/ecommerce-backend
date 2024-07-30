import express, { Router } from 'express';

import CommonController from '../../../src/controllers/frontend/guest/common-controller';
import CheckoutController from '../../../src/controllers/frontend/auth/checkout-controller';
import PagesController from '../../../src/controllers/frontend/guest/pages-controller';
const router: Router = express.Router();

router.get('/countries', CommonController.findAllCountries);
router.get('/states', CommonController.findAllStates);
router.get('/cities', CommonController.findAllCities);
router.get('/slider', CommonController.findAllSliders);
router.get('/banner', CommonController.findAllBanners);
router.get('/website-setups', CommonController.findWebsiteSetups);
router.get('/priority-product', CommonController.findPriorityProducts);
router.get('/collection-products', CommonController.findCollectionProducts);
router.get('/collection-categories', CommonController.findCollectionCategories);
router.get('/collection-brands', CommonController.findCollectionBrands);
router.get('/payment-methods', CommonController.findPaymentMethods);
router.get('/stores', CommonController.findAllStores);
router.post('/contact-us-submit', PagesController.contactUsSubmit);
router.post('/newsletter-submit', PagesController.newsletterSubmit);

router.get('/tap-success-response', CheckoutController.tapSuccessResponse);
router.get('/tap-failure-response', CheckoutController.tapSuccessResponse);

router.get('/tabby-success-response', CheckoutController.tabbySuccessResponse);
router.get('/tabby-failure-response', CheckoutController.tabbySuccessResponse);

router.get('/tamara-payment-response', CheckoutController.tamaraSuccessResponse);

router.get('/network-payment-response', CheckoutController.networkPaymentResponse);

export default router;

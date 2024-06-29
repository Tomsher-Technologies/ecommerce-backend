import express, { Router } from 'express';

import { frontendAuthMiddleware } from '../../../middleware/frontend/frontend-auth-middleware';

import OrderController from '../../../src/controllers/frontend/auth/order-controller';
import { logResponseStatus } from '../../../src/components/response-status';
import cartOrderController from '../../../src/controllers/frontend/cart-order-controller';
import CheckoutController from '../../../src/controllers/frontend/auth/checkout';

const router: Router = express.Router();

router.use(frontendAuthMiddleware);

router.get('/order-list', logResponseStatus, OrderController.orderList);
router.get('/:id', logResponseStatus, OrderController.getOrder);
router.post('/move-to-wishlist', logResponseStatus, cartOrderController.moveToWishlist);
router.post('/checkout', logResponseStatus, CheckoutController.checkout);
router.get('/checkout/retrieve-checkout-tabby/:tabby', logResponseStatus, CheckoutController.tabbyCheckoutRetrieveDetails);



export default router;

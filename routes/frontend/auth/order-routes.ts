import express, { Router } from 'express';

import { frontendAuthMiddleware } from '../../../middleware/frontend/frontend-auth-middleware';

import OrderController from '../../../src/controllers/frontend/auth/order-list';
import { logResponseStatus } from '../../../src/components/response-status';
import cartOrderController from '../../../src/controllers/frontend/cart-order-controller';
import checkoutController from '../../../src/controllers/frontend/auth/checkout';

const router: Router = express.Router();

router.use(frontendAuthMiddleware);

router.get('/order-list', logResponseStatus, OrderController.orderList);
router.post('/move-to-wishlist', logResponseStatus, cartOrderController.moveToWishlist);
router.post('/checkout', logResponseStatus, checkoutController.checkout);




export default router;

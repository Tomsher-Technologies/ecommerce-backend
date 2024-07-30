import express, { Router } from 'express';

import { frontendAuthAndUnAuthMiddleware, frontendAuthMiddleware } from '../../../middleware/frontend/frontend-auth-middleware';

import OrderController from '../../../src/controllers/frontend/auth/order-controller';
import validateObjectId, { logResponseStatus } from '../../../src/components/response-status';
import cartOrderController from '../../../src/controllers/frontend/cart-order-controller';
import CheckoutController from '../../../src/controllers/frontend/auth/checkout-controller';


const routerWithUser: Router = express.Router();

routerWithUser.use(frontendAuthAndUnAuthMiddleware);
routerWithUser.get('/:id', validateObjectId, OrderController.getOrder);

const OrderRoutes: Router = express.Router();
OrderRoutes.use(frontendAuthMiddleware);

OrderRoutes.get('/order-list', logResponseStatus, OrderController.orderList);
OrderRoutes.post('/move-to-wishlist', logResponseStatus, cartOrderController.moveToWishlist);
OrderRoutes.post('/checkout', logResponseStatus, CheckoutController.checkout);
OrderRoutes.get('/checkout/retrieve-checkout-tabby/:tabby', logResponseStatus, CheckoutController.tabbyCheckoutRetrieveDetails);
OrderRoutes.post('/order-cancel', logResponseStatus, OrderController.orderCancel);

OrderRoutes.use(routerWithUser);

export default OrderRoutes;

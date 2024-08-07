import express, { Router } from 'express';

import { frontendAuthAndUnAuthMiddleware, frontendAuthMiddleware } from '../../../middleware/frontend/frontend-auth-middleware';

import OrderController from '../../../src/controllers/frontend/auth/order-controller';
import validateObjectId, { logResponseStatus } from '../../../src/components/response-status';
import cartOrderController from '../../../src/controllers/frontend/cart-order-controller';
import CheckoutController from '../../../src/controllers/frontend/auth/checkout-controller';
import AdminOrdersController from '../../../src/controllers/admin/order/order-controller';

const OrderRoutes: Router = express.Router();

OrderRoutes.get('/invoice-download/:id', AdminOrdersController.getInvoice);

OrderRoutes.get('/:id', frontendAuthAndUnAuthMiddleware, validateObjectId, OrderController.getOrder);
OrderRoutes.get('/order-list', frontendAuthMiddleware, logResponseStatus, OrderController.orderList);
OrderRoutes.post('/move-to-wishlist', frontendAuthMiddleware, logResponseStatus, cartOrderController.moveToWishlist);
OrderRoutes.post('/checkout', frontendAuthMiddleware, logResponseStatus, CheckoutController.checkout);
OrderRoutes.get('/checkout/retrieve-checkout-tabby/:tabby', frontendAuthMiddleware, logResponseStatus, CheckoutController.tabbyCheckoutRetrieveDetails);
OrderRoutes.post('/order-cancel/:id', frontendAuthMiddleware, logResponseStatus, OrderController.orderCancel);
OrderRoutes.post('/order-return-edit/:id', frontendAuthMiddleware, logResponseStatus, OrderController.orderReturnAndEdit);


export default OrderRoutes;

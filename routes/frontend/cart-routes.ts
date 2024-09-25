import express, { Router } from 'express';

import { logResponseStatus } from '../../src/components/response-status';
import { frontendAuthAndUnAuthMiddleware } from "../../middleware/frontend/frontend-auth-middleware"
import cartOrderController from '../../src/controllers/frontend/cart-order-controller';

const router: Router = express.Router();

router.use(frontendAuthAndUnAuthMiddleware);

router.post('/create-cart', logResponseStatus, cartOrderController.createCartOrder);
router.get('/get-cart', logResponseStatus, cartOrderController.findUserCart);
router.post('/add-gift-wrap', logResponseStatus, cartOrderController.addGiftWrap);
router.post('/change-guest', logResponseStatus, cartOrderController.changeGuest);


export default router;
 
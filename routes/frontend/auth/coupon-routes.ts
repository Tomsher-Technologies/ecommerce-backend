import express, { Router } from 'express';

import { frontendAuthAndUnAuthMiddleware } from '../../../middleware/frontend/frontend-auth-middleware';

import CouponController from '../../../src/controllers/frontend/auth/coupon-controller';

const router: Router = express.Router();

router.use(frontendAuthAndUnAuthMiddleware);

router.get('/', CouponController.findAllCoupon);
router.post('/apply-coupon/:couponcode', CouponController.applyCoupon);


export default router;

import express, { Router } from 'express';

import { logResponseStatus } from '../../../src/components/response-status';
import { frontendAuthMiddleware } from '../../../middleware/frontend/frontend-auth-middleware';

import CouponController from '../../../src/controllers/frontend/auth/coupon-controller';

const router: Router = express.Router();

router.use(frontendAuthMiddleware);

router.get('/', logResponseStatus, CouponController.findAllCoupon);
router.post('/apply-coupon/:couponcode', logResponseStatus, CouponController.applyCoupon);


export default router;

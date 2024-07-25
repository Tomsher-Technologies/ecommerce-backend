"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const coupon_controller_1 = __importDefault(require("../../../src/controllers/frontend/auth/coupon-controller"));
const router = express_1.default.Router();
// router.use(frontendAuthMiddleware);
router.get('/', coupon_controller_1.default.findAllCoupon);
router.post('/apply-coupon/:couponcode', coupon_controller_1.default.applyCoupon);
exports.default = router;

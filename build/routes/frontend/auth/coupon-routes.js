"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const response_status_1 = require("../../../src/components/response-status");
const frontend_auth_middleware_1 = require("../../../middleware/frontend/frontend-auth-middleware");
const coupon_controller_1 = __importDefault(require("../../../src/controllers/frontend/auth/coupon-controller"));
const router = express_1.default.Router();
router.use(frontend_auth_middleware_1.frontendAuthMiddleware);
router.get('/', response_status_1.logResponseStatus, coupon_controller_1.default.findAllCoupon);
router.post('/apply-coupon/:couponcode', response_status_1.logResponseStatus, coupon_controller_1.default.applyCoupon);
exports.default = router;

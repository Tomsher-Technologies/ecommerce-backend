"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyCouponSchema = void 0;
const zod_1 = require("zod");
const cart_1 = require("../../../../constants/cart");
exports.applyCouponSchema = zod_1.z.object({
    deviceType: zod_1.z.enum([cart_1.couponDeviceType.desktop, cart_1.couponDeviceType.mobile], {
        required_error: 'Device type is required',
        invalid_type_error: 'Device type must be either "desktop" or "mobile"',
    }),
    clearActiveCartCoupon: zod_1.z.string().optional()
});

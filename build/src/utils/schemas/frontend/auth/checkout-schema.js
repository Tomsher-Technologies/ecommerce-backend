"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkoutSchema = void 0;
const zod_1 = require("zod");
const cart_1 = require("../../../../constants/cart");
exports.checkoutSchema = zod_1.z.object({
    shippingId: zod_1.z.string({ required_error: 'Please choose shipping address is required', }).min(3, 'Please choose shipping address is should be 3 chars minimum'),
    billingId: zod_1.z.string().optional(),
    orderComments: zod_1.z.string().optional(),
    paymentMethodId: zod_1.z.string({ required_error: 'Payment method  is required', }).min(3, 'Please choose Payment method'),
    couponCode: zod_1.z.string().optional(),
    deviceType: zod_1.z.enum([cart_1.couponDeviceType.desktop, cart_1.couponDeviceType.mobile], {
        invalid_type_error: 'Device type must be either "desktop" or "mobile"',
    }).optional(),
}).superRefine((data, ctx) => {
    if (data.couponCode && !data.deviceType) {
        ctx.addIssue({
            code: 'custom',
            message: 'The deviceType is required when couponCode is provided',
            path: ['deviceType']
        });
    }
});

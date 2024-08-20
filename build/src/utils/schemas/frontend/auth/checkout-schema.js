"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tabbyPaymentCaptureSchema = exports.checkoutSchema = void 0;
const zod_1 = require("zod");
const cart_1 = require("../../../../constants/cart");
exports.checkoutSchema = zod_1.z.object({
    shippingId: zod_1.z.string().optional(),
    billingId: zod_1.z.string().optional(),
    stateId: zod_1.z.string().optional(),
    cityId: zod_1.z.string().optional(),
    pickupStoreId: zod_1.z.string().optional(),
    orderComments: zod_1.z.string().optional(),
    paymentMethodId: zod_1.z.string({ required_error: 'Payment method is required' }).min(3, 'Please choose Payment method'),
    couponCode: zod_1.z.string().optional(),
    notVerifyUser: zod_1.z.boolean().optional(),
    deviceType: zod_1.z.enum([cart_1.couponDeviceType.desktop, cart_1.couponDeviceType.mobile], {
        invalid_type_error: 'Device type must be either "desktop" or "mobile"',
    }).optional(),
}).superRefine((data, ctx) => {
    if (!data.pickupStoreId && !data.shippingId) {
        ctx.addIssue({
            code: 'custom',
            message: 'Please choose shipping address is required',
            path: ['shippingId'],
        });
    }
    if (data.couponCode && !data.deviceType) {
        ctx.addIssue({
            code: 'custom',
            message: 'The deviceType is required when couponCode is provided',
            path: ['deviceType']
        });
    }
});
const orderSchema = zod_1.z.object({
    reference_id: zod_1.z.string({ required_error: 'Reference id is required' }).min(3, 'Please choose reference id'),
});
const captureSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    amount: zod_1.z.string().regex(/^\d+(\.\d{1,2})?$/, { message: "Invalid amount format" }),
});
exports.tabbyPaymentCaptureSchema = zod_1.z.object({
    id: zod_1.z.string({ required_error: 'Id is required' }).min(3, 'Please choose id'),
    status: zod_1.z.enum(["authorized", "closed", "rejected", "expired"]),
    is_test: zod_1.z.boolean().refine(value => value === true, { message: 'This is a test webhook' }),
    is_expired: zod_1.z.boolean(),
    amount: zod_1.z.string().regex(/^\d+(\.\d{1,2})?$/, { message: "Invalid amount format" }),
    currency: zod_1.z.string().length(3),
    order: orderSchema,
    captures: zod_1.z.array(captureSchema).nonempty({ message: "Captures cannot be empty" }),
});

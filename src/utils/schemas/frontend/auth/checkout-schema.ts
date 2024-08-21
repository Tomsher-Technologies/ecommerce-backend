import { z as zod } from 'zod';
import { couponDeviceType } from '../../../../constants/cart';

export const checkoutSchema = zod.object({
    shippingId: zod.string().optional(),
    billingId: zod.string().optional(),
    stateId: zod.string().optional(),
    cityId: zod.string().optional(),
    pickupStoreId: zod.string().optional(),
    orderComments: zod.string().optional(),
    paymentMethodId: zod.string({ required_error: 'Payment method is required' }).min(3, 'Please choose Payment method'),
    couponCode: zod.string().optional(),
    notVerifyUser: zod.boolean().optional(),
    deviceType: zod.enum([couponDeviceType.desktop, couponDeviceType.mobile], {
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

const orderSchema = zod.object({
    reference_id: zod.string({ required_error: 'Reference id is required' }).min(3, 'Please choose reference id'),
});

const captureSchema = zod.object({
    id: zod.string().optional(),
    amount: zod.string().regex(/^\d+(\.\d{1,2})?$/, { message: "Invalid amount format" }),
});

export const tabbyPaymentCaptureSchema = zod.object({
    id: zod.string({ required_error: 'Id is required' }).min(3, 'Please choose id'),
    status: zod.enum(["authorized", "closed", "rejected", "expired"]),
    is_test: zod.boolean().refine(value => value === true, { message: 'This is a test webhook' }),
    is_expired: zod.boolean(),
    amount: zod.string().regex(/^\d+(\.\d{1,2})?$/, { message: "Invalid amount format" }),
    currency: zod.string().length(3),
    order: orderSchema,
    captures: zod.array(captureSchema).nonempty({ message: "Captures cannot be empty" }),
});

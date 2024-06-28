import { z as zod } from 'zod';
import { couponDeviceType } from '../../../../constants/cart';

export const checkoutSchema = zod.object({
    shippingId: zod.string(),
    billingId: zod.string(),
    orderComments: zod.string().optional(),
    paymentMethodId: zod.string(),
    couponCode: zod.string().optional(),
    deviceType: zod.enum([couponDeviceType.desktop, couponDeviceType.mobile], {
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
})
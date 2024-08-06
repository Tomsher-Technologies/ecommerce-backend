import { z as zod } from 'zod';
import { couponDeviceType } from '../../../../constants/cart';

export const checkoutSchema = zod.object({
    shippingId:  zod.string({ required_error: 'Please choose shipping address is required', }).min(3, 'Please choose shipping address is should be 3 chars minimum'),
    billingId:  zod.string().optional(),
    stateId:  zod.string().optional(),
    cityId:  zod.string().optional(),
    pickupStoreId:  zod.string().optional(),
    orderComments: zod.string().optional(),
    paymentMethodId:  zod.string({ required_error: 'Payment method  is required', }).min(3, 'Please choose Payment method'),
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
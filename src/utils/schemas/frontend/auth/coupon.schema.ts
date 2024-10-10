import { z as zod } from 'zod';
import { couponDeviceType } from '../../../../constants/cart';

export const applyCouponSchema = zod.object({
    deviceType: zod.enum([couponDeviceType.desktop, couponDeviceType.mobile], {
        required_error: 'Device type is required',
        invalid_type_error: 'Device type must be either "desktop" or "mobile"',
    }),
    clearActiveCartCoupon:zod.string().optional()
});
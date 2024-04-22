import { z as zod } from 'zod';
import { isValidPriceFormat } from '@utils/helpers';

export const couponSchema = zod.object({
    couponType: zod.string({ required_error: 'Coupon type is required', }).min(2, 'Coupon type is should be 2 chars minimum'),
    couponCode: zod.string({ required_error: 'Coupon code is required', }).min(2, 'Coupon code is should be 2 chars minimum'),
    couponUseType: zod.string({ required_error: 'Coupon use type is required', }).min(2, 'Coupon use is should be 2 chars minimum'),
    couponProducts: zod.array(zod.unknown()).optional(),
    discountType: zod.string({ required_error: 'Discount type is required', }),
    discount: zod.string({ required_error: 'Discount is required' }).refine((val) => val.trim().length > 0 && isValidPriceFormat(val), { 
        message: 'Discount must be a valid price format (e.g., 10.99)' 
    }),
    discountDateRange: zod.array(zod.string(), { 
        required_error: 'Discount Date is required' 
    }).refine((val) => val.length > 0, { 
        message: 'Discount Date must contain at least 1 element' 
    }),
}).nonstrict();
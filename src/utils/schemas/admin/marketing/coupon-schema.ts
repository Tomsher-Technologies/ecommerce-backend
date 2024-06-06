import { z as zod } from 'zod';
import { isValidPriceFormat } from '../../../helpers';

export const couponSchema = zod.object({
    _id: zod.string().optional(),
    countryId: zod.string().optional(),
    couponCode: zod.string({ required_error: 'Coupon code is required' }).min(2, { message: 'Coupon code is should be 2 chars minimum' }),
    status: zod.string().optional(),
    couponDescription: zod.string().optional(),

    couponType: zod.string({ required_error: 'Coupon type is required' }).min(2, { message: 'Coupon type is should be 2 chars minimum' }),
    couponApplyValues: zod.array(zod.unknown()).optional(),
    minPurchaseValue: zod.string({ required_error: 'Minimum purchase value is required' }).min(1, { message: 'Minimum purchase value is should be 1 chars minimum' }),

    discountType: zod.string({ required_error: 'Discount type is required' }).refine((val) => val.trim().length > 0, {
        message: 'Discount type must not be empty'
    }),
    discountAmount: zod.string({ required_error: 'Discount is required' }).refine((val) => val.trim().length > 0 && isValidPriceFormat(val), {
        message: 'Discount must be a valid price format (e.g., 10.99)'
    }),
    discountMaxRedeemAmount: zod.string().optional(),

    couponUsage: zod.object({
        mobileAppoOlyCoupon: zod.boolean().optional(),
        onlyForNewUser: zod.boolean().optional(),
        enableLimitPerUser: zod.boolean().optional(),
        limitPerUser: zod.string().optional(),
        enableCouponUsageLimit: zod.boolean().optional(),
        couponUsageLimit: zod.string().optional(),
    }),

    enableFreeShipping: zod.boolean().optional(),
    discountDateRange: zod.array(zod.string(), {
        required_error: 'Discount Date is required'
    }).refine((val) => val.length > 0, {
        message: 'Discount Date must contain at least 1 element'
    }),
}).superRefine(({ couponType, couponApplyValues }, ctx) => {
    if (((couponType === 'for-product') || (couponType === 'for-category') || (couponType === 'for-brand'))) {
        if (couponApplyValues?.length === 0) {
            ctx.addIssue({
                code: "custom",
                message: "Please select at least one item to apply the coupon to.",
                path: ["couponApplyValues"]
            });
        }
    }
});

export const couponStatusSchema = zod.object({
    status: zod.string()
        .min(1, { message: "Status is required" })
        .max(1, { message: "Status must be a single character" })
        .refine(value => value === "1" || value === "2", {
            message: "Status must be either '1' or '2'"
        })
});
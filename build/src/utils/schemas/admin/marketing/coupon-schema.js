"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponStatusSchema = exports.couponSchema = void 0;
const zod_1 = require("zod");
const helpers_1 = require("../../../helpers");
exports.couponSchema = zod_1.z.object({
    _id: zod_1.z.string().optional(),
    countryId: zod_1.z.string().optional(),
    couponCode: zod_1.z.string({ required_error: 'Coupon code is required' }).min(2, { message: 'Coupon code is should be 2 chars minimum' }),
    status: zod_1.z.string().optional(),
    couponDescription: zod_1.z.string().optional(),
    couponType: zod_1.z.string({ required_error: 'Coupon type is required' }).min(2, { message: 'Coupon type is should be 2 chars minimum' }),
    couponApplyValues: zod_1.z.array(zod_1.z.unknown()).optional(),
    minPurchaseValue: zod_1.z.string({ required_error: 'Minimum purchase value is required' }).min(1, { message: 'Minimum purchase value is should be 1 chars minimum' }),
    discountType: zod_1.z.string({ required_error: 'Discount type is required' }).refine((val) => val.trim().length > 0, {
        message: 'Discount type must not be empty'
    }),
    discountAmount: zod_1.z.string({ required_error: 'Discount is required' }).refine((val) => val.trim().length > 0 && (0, helpers_1.isValidPriceFormat)(val), {
        message: 'Discount must be a valid price format (e.g., 10.99)'
    }),
    discountMaxRedeemAmount: zod_1.z.string().optional(),
    couponUsage: zod_1.z.object({
        mobileAppoOlyCoupon: zod_1.z.boolean().optional(),
        onlyForNewUser: zod_1.z.boolean().optional(),
        enableLimitPerUser: zod_1.z.boolean().optional(),
        limitPerUser: zod_1.z.string().optional(),
        enableCouponUsageLimit: zod_1.z.boolean().optional(),
        couponUsageLimit: zod_1.z.string().optional(),
        displayCoupon: zod_1.z.boolean().optional(),
    }),
    enableFreeShipping: zod_1.z.boolean().optional(),
    discountDateRange: zod_1.z.array(zod_1.z.string(), {
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
exports.couponStatusSchema = zod_1.z.object({
    status: zod_1.z.string()
        .min(1, { message: "Status is required" })
        .max(1, { message: "Status must be a single character" })
        .refine(value => value === "1" || value === "2", {
        message: "Status must be either '1' or '2'"
    })
});

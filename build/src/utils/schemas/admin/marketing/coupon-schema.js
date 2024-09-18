"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponExcelUploadSchema = exports.couponStatusSchema = exports.couponSchema = void 0;
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
        // mobileAppoOlyCoupon: zod.boolean().optional(),
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
function excelSerialToDate(serial) {
    if (typeof serial !== 'number')
        return null;
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const days = serial - 1;
    return new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
}
// Function to parse and validate string dates in M/D/YYYY format
function parseDate(dateString) {
    const dateParts = dateString.split('/');
    if (dateParts.length !== 3)
        return null;
    const month = parseInt(dateParts[0], 10);
    const day = parseInt(dateParts[1], 10);
    const year = parseInt(dateParts[2], 10);
    const date = new Date(Date.UTC(year, month - 1, day));
    return isNaN(date.getTime()) ? null : date;
}
const DiscountTypeEnum = zod_1.z.enum(['percentage', 'amount']);
exports.couponExcelUploadSchema = zod_1.z.object({
    _id: zod_1.z.string().optional(),
    Country: zod_1.z.string().optional(),
    Coupon_Code: zod_1.z.string({ required_error: 'Coupon code is required' }).min(2, { message: 'Coupon code is should be 2 chars minimum' }),
    Description: zod_1.z.string().optional(),
    Coupon_Type: zod_1.z.enum(['for-product', 'for-category', 'for-brand'], { required_error: 'Coupon type is required' }),
    Coupon_Applied_Fields: zod_1.z.string({ required_error: 'Coupon applied values is required' }).min(2, { message: 'Coupon applied values is should be 2 chars minimum' }),
    Minimum_Purchase_value: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).transform(val => String(val).trim()), // Convert number to string
    Discount_Type: zod_1.z.string({ required_error: 'Discount type is required' })
        .refine((val) => DiscountTypeEnum.options.includes(val), {
        message: 'Discount type must be either "percentage" or "amount"',
    }),
    Status: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).transform(val => String(val).trim()),
    Discount: zod_1.z.union([zod_1.z.string(), zod_1.z.number()])
        .transform(val => String(val).trim())
        .refine(val => val.length > 0 && (0, helpers_1.isValidPriceFormat)(val), {
        message: 'Discount must be a valid price format (e.g., 10.99)'
    }),
    Maximum_Redeem_Amount: zod_1.z.string().optional(),
    // couponUsage
    New_User: zod_1.z.boolean().optional(),
    Enable_Limit_Per_User: zod_1.z.boolean().optional(),
    Limit_Per_User: zod_1.z.string().optional(),
    Enable_Usage_Limit: zod_1.z.boolean().optional(),
    Usage_Limit: zod_1.z.string().optional(),
    Display_Coupon: zod_1.z.union([zod_1.z.boolean(), zod_1.z.number()]).transform(val => Boolean(val)),
    // END
    Free_Shipping: zod_1.z.boolean().optional(),
    Start_Date: zod_1.z.union([zod_1.z.string(), zod_1.z.number()])
        .refine((val) => (typeof val === 'string' && parseDate(val) !== null) || (typeof val === 'number' && excelSerialToDate(val) !== null), {
        message: 'Start date must be in the format M/D/YYYY or a valid Excel serial number',
    })
        .transform((val) => {
        if (typeof val === 'number') {
            const excelDate = excelSerialToDate(val);
            if (excelDate === null)
                throw new Error('Invalid Excel serial date');
            return excelDate.toISOString().split('T')[0]; // Transform to ISO date string (YYYY-MM-DD)
        }
        else {
            const parsedDate = parseDate(val);
            if (parsedDate === null)
                throw new Error('Invalid date format');
            return parsedDate.toISOString().split('T')[0]; // Transform to ISO date string (YYYY-MM-DD)
        }
    }),
    End_Date: zod_1.z.union([zod_1.z.string(), zod_1.z.number()])
        .refine((val) => (typeof val === 'string' && parseDate(val) !== null) || (typeof val === 'number' && excelSerialToDate(val) !== null), {
        message: 'End date must be in the format M/D/YYYY or a valid Excel serial number',
    })
        .transform((val) => {
        if (typeof val === 'number') {
            const excelDate = excelSerialToDate(val);
            if (excelDate === null)
                throw new Error('Invalid Excel serial date');
            return excelDate.toISOString().split('T')[0]; // Transform to ISO date string (YYYY-MM-DD)
        }
        else {
            const parsedDate = parseDate(val);
            if (parsedDate === null)
                throw new Error('Invalid date format');
            return parsedDate.toISOString().split('T')[0]; // Transform to ISO date string (YYYY-MM-DD)
        }
    }),
}).superRefine(({ Coupon_Type, Coupon_Applied_Fields }, ctx) => {
    if (['for-product', 'for-category', 'for-brand'].includes(Coupon_Type)) {
        if (!Coupon_Applied_Fields || Coupon_Applied_Fields.length === 0) {
            ctx.addIssue({
                code: "custom",
                message: "Please select at least one item to apply the coupon to.",
                path: ["Coupon_Applied_Fields"],
            });
        }
    }
});

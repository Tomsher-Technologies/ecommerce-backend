import { ZodAny, z as zod } from 'zod';
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
        // mobileAppoOlyCoupon: zod.boolean().optional(),
        onlyForNewUser: zod.boolean().optional(),
        enableLimitPerUser: zod.boolean().optional(),
        limitPerUser: zod.string().optional(),
        enableCouponUsageLimit: zod.boolean().optional(),
        couponUsageLimit: zod.string().optional(),
        displayCoupon: zod.boolean().optional(),
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

function excelSerialToDate(serial: number): Date | null {
    if (typeof serial !== 'number') return null;
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const days = serial - 1;
    return new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
}

// Function to parse and validate string dates in M/D/YYYY format
function parseDate(dateString: string): Date | null {
    const dateParts = dateString.split('/');
    if (dateParts.length !== 3) return null;

    const month = parseInt(dateParts[0], 10);
    const day = parseInt(dateParts[1], 10);
    const year = parseInt(dateParts[2], 10);

    const date = new Date(Date.UTC(year, month - 1, day));
    return isNaN(date.getTime()) ? null : date;
}
const booleanStringTransform = (val: any) => {
    if (typeof val === 'string') {
        return ['true', '1'].includes(val.toLowerCase());
    }
    return Boolean(val);
};

const booleanStringSuperRefine = (fieldName: string) => (val: any, ctx: any) => {
    if (typeof val === 'string') {
        if (['true', 'false', '0', '1'].includes(val.toLowerCase())) {
            return;
        }
    } else if (typeof val === 'boolean' || typeof val === 'number') {
        return;
    }
    ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        message: `${fieldName} must be either "true", "false", "1", "0", or their equivalent boolean values`,
    });
};

const DiscountTypeEnum = zod.enum(['percentage', 'amount']);

const validateAndTransformDate = (fieldName: string) => {
    return zod.union([zod.string(), zod.number()])
        .refine(val =>
            (typeof val === 'string' && parseDate(val) !== null) ||
            (typeof val === 'number' && excelSerialToDate(val) !== null), {
            message: `${fieldName} must be in the format M/D/YYYY or a valid Excel serial number`,
        })
        .transform(val => {
            let date: Date | null = null;
            if (typeof val === 'number') {
                date = excelSerialToDate(val);
                if (date === null) throw new Error('Invalid Excel serial date');
            } else {
                date = parseDate(val);
                if (date === null) throw new Error('Invalid date format');
            }
            return date.toISOString().split('T')[0]; // Transform to ISO date string (YYYY-MM-DD)
        });
};
type StatusEnum = '1' | '2' | '3';

export const couponExcelUploadSchema = zod.object({
    _id: zod.string().optional(),
    Country: zod.string({ required_error: 'Country is required' }).min(2, { message: 'Country is should be 2 chars minimum' }),
    Coupon_Code: zod.string({ required_error: 'Coupon code is required' }).min(2, { message: 'Coupon code is should be 2 chars minimum' }),
    Description: zod.string().optional(),
    Coupon_Type: zod.enum(['for-product', 'for-category', 'for-brand', 'entire-orders'], { required_error: 'Coupon type is required' }),
    Coupon_Applied_Fields: zod.string({ required_error: 'Coupon applied values is required' }).min(2, { message: 'Coupon applied values is should be 2 chars minimum' }),
    Minimum_Purchase_value: zod.number({ required_error: 'Coupon applied value is required' })
        .transform(val => Number(val))
        .refine(val => ((!isNaN(val) && val > 0) || val === 0), {
            message: 'Minimum Purchase value must be a valid positive number',
        }),// Convert number to string
    Discount_Type: zod.string({ required_error: 'Discount type is required' })
        .refine((val) => DiscountTypeEnum.options.includes(val as any), {
            message: 'Discount type must be either "percentage" or "amount"',
        }),
    Status: zod.union([zod.string(), zod.number()])
        .transform(val => String(val).trim())
        .refine((val): val is StatusEnum => ['1', '2', '3'].includes(val), {
            message: 'Status must be one of "1", "2", or "3"',
        }),
    Discount: zod.union([zod.string(), zod.number()])
        .transform(val => Number(val))
        .refine(val => ((!isNaN(val) && val > 0) || val === 0), {
            message: 'Discount must be a valid price format (e.g., 10.99)',
        }),
    Maximum_Redeem_Amount: zod.union([zod.string(), zod.number()])
        .transform(val => Number(val))
        .refine(val => !isNaN(val) && val > 0, {
            message: 'Maximum redeem amount must be a valid positive number',
        }),
    // couponUsage
    New_User: zod.union([zod.string(), zod.boolean(), zod.number()])
        .optional()
        .superRefine(booleanStringSuperRefine('New User'))
        .transform(booleanStringTransform).optional(),
    Enable_Limit_Per_User: zod.union([zod.string(), zod.boolean(), zod.number()])
        .optional()
        .superRefine(booleanStringSuperRefine('Enable Limit Per User'))
        .transform(booleanStringTransform).optional(),

    Enable_Usage_Limit: zod.union([zod.string(), zod.boolean(), zod.number()])
        .optional()
        .superRefine(booleanStringSuperRefine('Enable Usage Limit'))
        .transform(booleanStringTransform).optional(),
    Limit_Per_User: zod.number().optional()
        .transform(val => Number(val))
        .refine(val => !isNaN(val) && val > 0, {
            message: 'Limit Per User must be a valid non-negative number',
        }).optional(),
    Usage_Limit: zod.union([zod.string(), zod.number()])
        .transform(val => Number(val))
        .refine(val => !isNaN(val) && val > 0, {
            message: 'Usage Limit must must be a valid positive number',
        }).optional(),
    Display_Coupon: zod.union([zod.string(), zod.boolean(), zod.number()])
        .optional()
        .superRefine(booleanStringSuperRefine('Display Coupon'))
        .transform(booleanStringTransform).optional(),
    // END
    Free_Shipping: zod.union([zod.string(), zod.boolean(), zod.number()])
        .optional()
        .superRefine(booleanStringSuperRefine('Free Shipping'))
        .transform(booleanStringTransform).optional(),
    Start_Date: validateAndTransformDate('Start date'),
    End_Date: validateAndTransformDate('End date'),
}).superRefine(({ Coupon_Type, Coupon_Applied_Fields, Discount }, ctx) => {
    if (['for-product', 'for-category', 'for-brand', 'entire-orders'].includes(Coupon_Type)) {
        if (!Coupon_Applied_Fields || Coupon_Applied_Fields.length === 0) {
            ctx.addIssue({
                code: "custom",
                message: "Please select at least one item to apply the coupon to.",
                path: ["Coupon_Applied_Fields"],
            });
        }
    }
});
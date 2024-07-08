import { z as zod } from 'zod';

export const paymentMethodSchema = zod.object({
    countryId: zod.any().optional(),
    paymentMethodTitle: zod.string({ required_error: 'Payment method title is required', }).min(3, 'Payment method title is should be 3 chars minimum'),
    operatorName: zod.string({ required_error: "Payment gatway operator name title is required, if cash on delivery just add 'Cash On delivery'", }).min(3, "Payment gatway operator name title is should be 3 chars minimum,if cash on delivery just add 'Cash On delivery"),
    subTitle: zod.string().optional(),
    description: zod.string({ required_error: 'Payment method description is required', }).min(2, 'Payment method description is should be 2 chars minimum'),
    paymentMethodValues: zod.any({ required_error: 'Payment method values is required' }),
    enableDisplay: zod.string().optional(),
    languageValues: zod.any().optional(),
    status: zod.string().optional()
}).nonstrict();

export const paymentMethodStatusSchema = zod.object({
    status: zod.string()
        .min(1, { message: "Status is required" })
        .max(1, { message: "Status must be a single character" })
        .refine(value => value === "1" || value === "2", {
            message: "Status must be either '1' or '2'"
        })
});
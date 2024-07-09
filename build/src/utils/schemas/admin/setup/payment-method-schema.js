"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentMethodStatusSchema = exports.paymentMethodSchema = void 0;
const zod_1 = require("zod");
exports.paymentMethodSchema = zod_1.z.object({
    countryId: zod_1.z.any().optional(),
    paymentMethodTitle: zod_1.z.string({ required_error: 'Payment method title is required', }).min(3, 'Payment method title is should be 3 chars minimum'),
    operatorName: zod_1.z.string({ required_error: "Payment gatway operator name title is required, if cash on delivery just add 'Cash On delivery'", }).min(3, "Payment gatway operator name title is should be 3 chars minimum,if cash on delivery just add 'Cash On delivery"),
    subTitle: zod_1.z.string().optional(),
    description: zod_1.z.string({ required_error: 'Payment method description is required', }).min(2, 'Payment method description is should be 2 chars minimum'),
    paymentMethodValues: zod_1.z.any({ required_error: 'Payment method values is required' }),
    enableDisplay: zod_1.z.string().optional(),
    languageValues: zod_1.z.any().optional(),
    status: zod_1.z.string().optional()
}).nonstrict();
exports.paymentMethodStatusSchema = zod_1.z.object({
    status: zod_1.z.string()
        .min(1, { message: "Status is required" })
        .max(1, { message: "Status must be a single character" })
        .refine(value => value === "1" || value === "2", {
        message: "Status must be either '1' or '2'"
    })
});

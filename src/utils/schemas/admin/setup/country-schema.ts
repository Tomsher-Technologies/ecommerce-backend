import { z as zod } from 'zod';

export const countrySchema = zod.object({
    countryTitle: zod.string({ required_error: 'Country title is required', }).min(3, 'Country title is should be 3 chars minimum'),
    countryCode: zod.string({ required_error: 'Country code is required', }).min(2, 'Country code is should be 2 chars minimum'),
    currencyCode: zod.string({ required_error: 'Currency code is required', }).min(2, 'Currency code is should be 2 chars minimum'),
    countryShortTitle: zod.string({ required_error: 'Country Short title is required', }).min(2, 'Currency code is should be 2 chars minimum'),
    isOrigin: zod.boolean().optional()
}).nonstrict();

export const countryStatusSchema = zod.object({
    status: zod.string()
        .min(1, { message: "Status is required" })
        .max(1, { message: "Status must be a single character" })
        .refine(value => value === "1" || value === "2", {
            message: "Status must be either '1' or '2'"
        })
});
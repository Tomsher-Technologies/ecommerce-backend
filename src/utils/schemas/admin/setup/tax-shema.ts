import { z as zod } from 'zod';

export const taxSchema = zod.object({
    taxTitle: zod.string({ required_error: 'Tax title is required', }).min(3, 'Tax title is should be 3 chars minimum'),
    taxPercentage: zod.string({ required_error: 'Tax percentage is required', })
}).nonstrict();


export const taxStatusSchema = zod.object({
    status: zod.string()
        .min(1, { message: "Status is required" })
        .max(1, { message: "Status must be a single character" })
        .refine(value => value === "1" || value === "2", {
            message: "Status must be either '1' or '2'"
        })
});
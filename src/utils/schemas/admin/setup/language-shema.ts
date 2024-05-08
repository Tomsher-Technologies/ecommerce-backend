import { z as zod } from 'zod';

export const languageSchema = zod.object({
    languageTitle: zod.string({ required_error: 'Language title is required', }).min(3, 'Language title is should be 3 chars minimum'),
    languageCode: zod.string({ required_error: 'Language code is required', }).min(2, 'Language code is should be 2 chars minimum'),
}).nonstrict(); 


export const languageStatusSchema = zod.object({
    status: zod.string()
        .min(1, { message: "Status is required" })
        .max(1, { message: "Status must be a single character" })
        .refine(value => value === "1" || value === "2", {
            message: "Status must be either '1' or '2'"
        })
});
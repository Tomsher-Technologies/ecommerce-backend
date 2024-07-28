import { z as zod } from 'zod';

export const stateSchema = zod.object({
    countryId: zod.string({ required_error: 'country id is required', }),
    stateTitle: zod.string({ required_error: 'State title is required', }).min(3, 'State title is should be 3 chars minimum'),
}).nonstrict();

export const stateStatusSchema = zod.object({
    status: zod.string()
        .min(1, { message: "Status is required" })
        .max(1, { message: "Status must be a single character" })
        .refine(value => value === "1" || value === "2", {
            message: "Status must be either '1' or '2'"
        })
});
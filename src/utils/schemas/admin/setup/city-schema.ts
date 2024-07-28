import { z as zod } from 'zod';

export const citySchema = zod.object({
    countryId: zod.string({ required_error: 'country id is required', }),
    stateId: zod.string({ required_error: 'state id is required', }),
    cityTitle: zod.string({ required_error: 'City title is required', }).min(3, 'City title is should be 3 chars minimum'),
}).nonstrict();

export const cityStatusSchema = zod.object({
    status: zod.string()
        .min(1, { message: "Status is required" })
        .max(1, { message: "Status must be a single character" })
        .refine(value => value === "1" || value === "2", {
            message: "Status must be either '1' or '2'"
        })
});
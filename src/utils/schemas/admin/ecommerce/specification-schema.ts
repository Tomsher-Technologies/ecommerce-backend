import { z as zod } from 'zod';

export const specificationSchema = zod.object({
    specificationTitle: zod.string({ required_error: 'Specification title is required', }).min(2, 'Specification title is should be 2 chars minimum'),
    SpecificationValues: zod.array(zod.unknown()).optional(),
    languageValues: zod.any().optional(),
}).nonstrict();

export const specificationStatusSchema = zod.object({
    status: zod.string()
        .min(1, { message: "Status is required" })
        .max(1, { message: "Status must be a single character" })
        .refine(value => value === "1" || value === "2", {
            message: "Status must be either '1' or '2'"
        })
});

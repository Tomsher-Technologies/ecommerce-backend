import { z as zod } from 'zod';

export const attributeSchema = zod.object({
    attributeTitle: zod.string({ required_error: 'Attribute title is required', }).min(2, 'Attribute title is should be 2 chars minimum'),
    attributeType: zod.string({ required_error: 'Attribute type is required', }).min(2, 'Attribute type is should be 2 chars minimum'),
    attributeValues: zod.array(zod.unknown()).optional(),
    languageValues: zod.any().optional(),
    status: zod.string().optional(),
}).nonstrict();

export const attributeStatusSchema = zod.object({
    status: zod.string()
        .min(1, { message: "Status is required" })
        .max(1, { message: "Status must be a single character" })
        .refine(value => value === "1" || value === "2", {
            message: "Status must be either '1' or '2'"
        })
});
import { z as zod} from 'zod';

export const brandSchema = zod.object({
    brandTitle: zod.string({ required_error: 'Brand title is required', }).min(2, 'Brand title is should be 2 chars minimum'),
    description: zod.string({ required_error: 'Description is required', }).min(10, 'Description is should be 10 chars minimum'),
    brandImageUrl: zod.string().optional(),
    brandBannerImageUrl: zod.string().optional(),
    brandImage: zod.any({ required_error: 'Brand image is required' }).nullable(),
    languageValues: zod.any().optional(),
}).nonstrict();

export const updateWebsitePrioritySchema = zod.object({
    keyColumn: zod.string({ required_error: 'Key column is required', }).min(2, 'Key column is should be 2 chars minimum'),
    root: zod.array(zod.any()).optional(),
    container1: zod.array(zod.any()).optional(),
    status: zod.string().optional(),
}).nonstrict();


export const brandStatusSchema = zod.object({
    status: zod.string()
        .min(1, { message: "Status is required" })
        .max(1, { message: "Status must be a single character" })
        .refine(value => value === "1" || value === "2", {
            message: "Status must be either '1' or '2'"
        })
});
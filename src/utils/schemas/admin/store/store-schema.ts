import { z as zod } from 'zod';

export const storeSchema = zod.object({
    storeTitle: zod.string({
        required_error: 'Store title is required',
    }).min(3, 'Store title should be at least 3 characters long'),
    slug: zod.string().optional(),
    storePhone: zod.string({
        required_error: 'Store phone is required',
    }).min(2, 'Store phone should be at least 2 characters long')
        .regex(/^\+?[1-9]\d{1,14}$/, 'Store phone must be a valid phone number'),
    storePhone2: zod.string().optional(),
    storeAddress: zod.string({
        required_error: 'Store address is required',
    }).min(2, 'Store address should be at least 2 characters long'),
    storeWorkingHours: zod.string().optional(),
    storeEmail: zod.string({
        required_error: 'Store email is required',
    }).email('Store email must be a valid email address'),
    storeImageUrl: zod.string().optional(),
    latitude: zod.string().optional(),
    longitude: zod.string().optional(),
    status: zod.string().optional()
});


export const storeStatusSchema = zod.object({
    status: zod.string()
        .min(1, { message: "Status is required" })
        .max(1, { message: "Status must be a single character" })
        .refine(value => value === "1" || value === "2", {
            message: "Status must be either '1' or '2'"
        })
});
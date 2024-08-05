import { z as zod } from 'zod';

export const storeSchema = zod.object({
    countryId: zod.string().optional(),
    storeTitle: zod.string({
        required_error: 'Store title is required',
    }).min(3, 'Store title should be at least 3 characters long'),
    slug: zod.string().optional(),
    storePhone: zod.string().optional(),
    storePhone2: zod.string().optional(),
    storeAddress: zod.string({
        required_error: 'Store address is required',
    }).min(2, 'Store address should be at least 2 characters long'),
    storeWorkingHours: zod.string().optional(),
    storeEmail: zod.string().optional(),
    storeImageUrl: zod.string().optional(),
    storeDesription: zod.string().optional(),
    longitude: zod.union([
        zod.number().min(-180).max(180, { message: "Invalid longitude; must be between -180 and 180 degrees" }),
        zod.string().regex(/^(\-?\d{1,3}(\.\d+)?)$/, { message: "Invalid longitude format" })
    ]),
    latitude: zod.union([
        zod.number().min(-90).max(90, { message: "Invalid latitude; must be between -90 and 90 degrees" }),
        zod.string().regex(/^(\-?\d{1,2}(\.\d+)?)$/, { message: "Invalid latitude format" })
    ]),
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
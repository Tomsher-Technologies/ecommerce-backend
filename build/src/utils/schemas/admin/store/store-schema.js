"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeStatusSchema = exports.storeSchema = void 0;
const zod_1 = require("zod");
exports.storeSchema = zod_1.z.object({
    storeTitle: zod_1.z.string({
        required_error: 'Store title is required',
    }).min(3, 'Store title should be at least 3 characters long'),
    slug: zod_1.z.string().optional(),
    storePhone: zod_1.z.string({
        required_error: 'Store phone is required',
    }).min(2, 'Store phone should be at least 2 characters long')
        .regex(/^\+?[1-9]\d{1,14}$/, 'Store phone must be a valid phone number'),
    storePhone2: zod_1.z.string().optional(),
    storeAddress: zod_1.z.string({
        required_error: 'Store address is required',
    }).min(2, 'Store address should be at least 2 characters long'),
    storeWorkingHours: zod_1.z.string().optional(),
    storeEmail: zod_1.z.string({
        required_error: 'Store email is required',
    }).email('Store email must be a valid email address'),
    storeImageUrl: zod_1.z.string().optional(),
    latitude: zod_1.z.string().optional(),
    longitude: zod_1.z.string().optional(),
    status: zod_1.z.string().optional()
});
exports.storeStatusSchema = zod_1.z.object({
    status: zod_1.z.string()
        .min(1, { message: "Status is required" })
        .max(1, { message: "Status must be a single character" })
        .refine(value => value === "1" || value === "2", {
        message: "Status must be either '1' or '2'"
    })
});

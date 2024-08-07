"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryStatusSchema = exports.updateWebsitePrioritySchema = exports.categorySchema = void 0;
const zod_1 = require("zod");
exports.categorySchema = zod_1.z.object({
    categoryTitle: zod_1.z.string({ required_error: 'Category title is required', }).min(2, 'Category title is should be 2 chars minimum'),
    description: zod_1.z.string({ required_error: 'Description is required', }).min(10, 'Description is should be 10 chars minimum'),
    parentCategory: zod_1.z.string().optional(),
    categoryImageUrl: zod_1.z.string().optional(),
    categorySecondImageUrl: zod_1.z.string().optional(),
    categoryImage: zod_1.z.any({ required_error: 'Category image is required' }).nullable(),
    languageValues: zod_1.z.any().optional(),
    status: zod_1.z.string().optional(),
    slug: zod_1.z.any().optional(),
    level: zod_1.z.any().optional(),
    seoData: zod_1.z.any().optional(),
    metaTitle: zod_1.z.string().optional(),
    metaKeywords: zod_1.z.string().optional(),
    metaDescription: zod_1.z.string().optional(),
    ogTitle: zod_1.z.string().optional(),
    ogDescription: zod_1.z.string().optional(),
    metaImageUrl: zod_1.z.string().optional(),
    twitterTitle: zod_1.z.string().optional(),
    twitterDescription: zod_1.z.string().optional(),
}).nonstrict();
exports.updateWebsitePrioritySchema = zod_1.z.object({
    keyColumn: zod_1.z.string({ required_error: 'Key column is required', }).min(2, 'Key column is should be 2 chars minimum'),
    root: zod_1.z.array(zod_1.z.any()).optional(),
    container1: zod_1.z.array(zod_1.z.any()).optional(),
}).nonstrict();
exports.categoryStatusSchema = zod_1.z.object({
    status: zod_1.z.string()
        .min(1, { message: "Status is required" })
        .max(1, { message: "Status must be a single character" })
        .refine(value => value === "1" || value === "2", {
        message: "Status must be either '1' or '2'"
    })
});

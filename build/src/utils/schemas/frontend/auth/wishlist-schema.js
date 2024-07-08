"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveTCartSchema = exports.addToWishlistSchema = void 0;
const zod_1 = require("zod");
exports.addToWishlistSchema = zod_1.z.object({
    slug: zod_1.z.string({ required_error: 'Product slug is required', }).min(1, { message: 'Slug is required' }),
    sku: zod_1.z.string({ required_error: 'Product sku is required', }).min(1, { message: 'SKU is required' }),
});
exports.moveTCartSchema = zod_1.z.object({
    slug: zod_1.z.string().min(1, { message: 'Slug is required' }),
    sku: zod_1.z.string().min(1, { message: 'SKU is required' }),
});

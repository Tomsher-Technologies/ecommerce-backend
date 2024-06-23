import { z as zod } from 'zod';

export const addToWishlistSchema = zod.object({
    slug: zod.string({ required_error: 'Product slug is required', }).min(1, { message: 'Slug is required' }),
    sku: zod.string({ required_error: 'Product sku is required', }).min(1, { message: 'SKU is required' }),
});

export const moveTCartSchema = zod.object({
    slug: zod.string().min(1, { message: 'Slug is required' }),
    sku: zod.string().min(1, { message: 'SKU is required' }),
});
import { z as zod } from 'zod';

export const cartSchema = zod.object({
    customerId: zod.string().optional(),
    productId: zod.string(),
    variantId: zod.string(),
    quantity: zod.string(),
    sku: zod.string(),
    slug: zod.string(),
    guestUserId: zod.any().optional(),

}).nonstrict();
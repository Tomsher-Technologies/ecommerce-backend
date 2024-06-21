import { z as zod } from 'zod';

export const cartSchema = zod.object({
    customerId: zod.string().optional(),

    guestUserId: zod.any().optional(),

}).nonstrict();
export const cartProductSchema = zod.object({
    customerId: zod.string().optional(),
    variantId: zod.string(),
    quantity: zod.string(),
    slug: zod.string(),
    guestUserId: zod.any().optional(),

}).nonstrict();
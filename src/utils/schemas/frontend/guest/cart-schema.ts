import { z as zod } from 'zod';

export const cartSchema = zod.object({
    customerId: zod.string().optional(),
    slug: zod.string().optional(),
    variantId: zod.string().optional(),
    quantity: zod.number(),
    guestUserId: zod.any().optional(),

}).refine(data => (data.slug !== undefined || data.variantId !== undefined), {
    message: 'Either slug or variantId must be provided',
});
export const cartProductSchema = zod.object({
    customerId: zod.string().optional(),
    variantId: zod.string().optional(),
    quantity: zod.string().optional(),
    slug: zod.string().optional(),
    guestUserId: zod.any().optional(),

}).nonstrict();
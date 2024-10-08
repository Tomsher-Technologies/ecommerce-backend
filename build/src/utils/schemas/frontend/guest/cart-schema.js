"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartProductSchema = exports.cartSchema = void 0;
const zod_1 = require("zod");
exports.cartSchema = zod_1.z.object({
    customerId: zod_1.z.string().optional(),
    slug: zod_1.z.string().optional(),
    variantId: zod_1.z.string().optional(),
    quantity: zod_1.z.number(),
    guestUserId: zod_1.z.any().optional(),
}).refine(data => (data.slug !== undefined || data.variantId !== undefined), {
    message: 'Either slug or variantId must be provided',
});
exports.cartProductSchema = zod_1.z.object({
    customerId: zod_1.z.string().optional(),
    variantId: zod_1.z.string().optional(),
    quantity: zod_1.z.string().optional(),
    slug: zod_1.z.string().optional(),
    guestUserId: zod_1.z.any().optional(),
}).nonstrict();

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartSchema = void 0;
const zod_1 = require("zod");
exports.cartSchema = zod_1.z.object({
    customerId: zod_1.z.string().optional(),
    productId: zod_1.z.string(),
    variantId: zod_1.z.string(),
    quantity: zod_1.z.string(),
    sku: zod_1.z.string(),
    slug: zod_1.z.string(),
    guestUserId: zod_1.z.any().optional(),
}).nonstrict();
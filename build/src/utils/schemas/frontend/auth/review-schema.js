"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewStatusSchema = exports.reviewSchema = void 0;
const zod_1 = require("zod");
exports.reviewSchema = zod_1.z.object({
    name: zod_1.z.string({ required_error: 'Name is required', }).min(3, 'Name is should be 3 chars minimum'),
    productId: zod_1.z.string({ required_error: 'productId is required', }),
    reviewTitle: zod_1.z.string({ required_error: 'Review Title is required', }),
    reviewContent: zod_1.z.string({ required_error: 'Review Content is required', }),
    rating: zod_1.z.string({ required_error: 'Rating is required', }),
    reviewStatus: zod_1.z.string().optional(),
    editStatus: zod_1.z.string().optional(),
});
exports.reviewStatusSchema = zod_1.z.object({
    reviewStatus: zod_1.z.string()
        .min(1, { message: "Status is required" })
        .max(1, { message: "Status must be a single character" })
        .refine(value => value === "1" || value === "2" || value === "3", {
        message: "Status must be either '1' or '2' or'3"
    })
});

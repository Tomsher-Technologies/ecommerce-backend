import { z as zod } from 'zod';

export const reviewSchema = zod.object({
    name: zod.string({ required_error: 'Name is required', }).min(3, 'Name is should be 3 chars minimum'),
    productId: zod.string({ required_error: 'productId is required', }),
    reviewTitle: zod.string({ required_error: 'Review Title is required', }),
    reviewContent: zod.string({ required_error: 'Review Content is required', }),
    rating: zod.string({ required_error: 'Rating is required', }),
    reviewStatus: zod.string().optional(),
    editStatus: zod.string().optional(),
})

export const reviewStatusSchema = zod.object({
    reviewStatus: zod.string()
        .min(1, { message: "Status is required" })
        .max(1, { message: "Status must be a single character" })
        .refine(value => value === "1" || value === "2" || value === "3", {
            message: "Status must be either '1' or '2' or'3"
        })
});
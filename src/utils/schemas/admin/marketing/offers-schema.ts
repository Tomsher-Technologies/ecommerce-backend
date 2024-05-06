import { z as zod } from 'zod';

export const offersSchema = zod.object({
    _id: zod.string().optional(),
    offerTitle: zod.string({ required_error: 'Offer name is required' }).min(2, { message: 'Offer must be at least 2 characters long' }),
    slug: zod.string().min(2, { message: 'Slug is required' }),
    linkType: zod.string().refine((val) => val.trim().length > 0, {
        message: 'Link type must not be empty'
    }),
    link: zod.any().optional(),
    category: zod.string().optional(),
    brand: zod.string().optional(),
    offerType: zod.string().refine((val) => val.trim().length > 0, {
        message: 'Offer type must not be empty'
    }),
    offerIN: zod.string().optional(),
    buyQuantity: zod.string().optional(),
    getQuantity: zod.string().optional(),
    offerDateRange: zod.any(),
    offerImageUrl: zod.string().optional(),
    offerImage: zod.any({ required_error: 'Offer image is required' }).nullable(),
    status: zod.string().optional(),
}).superRefine(({ linkType, category, brand, link, offerType, buyQuantity, getQuantity, offerIN }, ctx) => {
    if (linkType === 'category') {
        if (category === '') {
            ctx.addIssue({
                code: "custom",
                message: "Category is required when link type is category",
                path: ["category"]
            });
        }
        if (brand === '') {
            ctx.addIssue({
                code: "custom",
                message: "Brand is required when link type is brand",
                path: ["brand"]
            });
        }
    } else if (linkType === 'product') {
        if (link.length <= 0) {
            ctx.addIssue({
                code: "custom",
                message: "Product is required when link type is product",
                path: ["link"]
            });
        }
    }
    if (offerType === 'buy-x-get-y') {
        if (buyQuantity === '') {
            ctx.addIssue({
                code: "custom",
                message: "Buy quantity is required when offer type is Buy X Get Y",
                path: ["buyQuantity"]
            });
        }
        if (getQuantity === '') {
            ctx.addIssue({
                code: "custom",
                message: "Get quantity is required when offer type is Buy X Get Y",
                path: ["getQuantity"]
            });
        }
    } else if ((offerType === 'percent' || offerType === 'amount-off')) {
        if (offerIN === '') {
            ctx.addIssue({
                code: "custom",
                message: `Get offer ${offerType} is required when offer type is ${offerType}`,
                path: ["offerIN"]
            });
        }
    }
});


export const offerStatusSchema = zod.object({
    status: zod.string()
        .min(1, { message: "Status is required" })
        .max(1, { message: "Status must be a single character" })
        .refine(value => value === "1" || value === "2", {
            message: "Status must be either '1' or '2'"
        })
});
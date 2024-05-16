import { z as zod } from 'zod';

export const offersSchema = zod.object({
    _id: zod.string().optional(),
    countryId: zod.string({ required_error: 'Country is required', }).min(2, 'Country is should be 2 chars minimum'),
    offerTitle: zod.string({ required_error: 'Offer name is required' }).min(2, { message: 'Offer must be at least 2 characters long' }),
    slug: zod.string().min(2, { message: 'Slug is required' }),
    offerDescription: zod.string().optional(),
    offersBy: zod.string({ required_error: 'Offer to must not be empty' }).refine((val) => val.trim().length > 0, {
        message: 'Offer to must not be empty'
    }),
    offerApplyValues: zod.any({ required_error: 'lease select at least one item to apply the offer to.' }),

    offerType: zod.string().refine((val) => val.trim().length > 0, {
        message: 'Offer type must not be empty'
    }),
    offerIN: zod.string().optional(),
    buyQuantity: zod.string().optional(),
    getQuantity: zod.string().optional(),
    offerDateRange: zod.any({ required_error: 'Offer Date must to select start date to end date ranges' }),
    offerImageUrl: zod.string().optional(),
    offerImage: zod.any({ required_error: 'Offer image is required' }).nullable(),
    status: zod.string().optional(),
}).superRefine(({ offersBy, offerApplyValues, offerType, buyQuantity, getQuantity, offerIN }, ctx) => {
    if (((offersBy === 'product') || (offersBy === 'category') || (offersBy === 'brand'))) {
        if (offerApplyValues?.length === 0) {
            ctx.addIssue({
                code: "custom",
                message: "Please select at least one item to apply the offer to.",
                path: ["offerApplyValues"]
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
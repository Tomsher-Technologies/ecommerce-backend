import { z as zod } from 'zod';

const isNonNegativeInteger = (val: any): boolean => {
    if (typeof val === 'number') {
        return val >= 0 && Number.isInteger(val);
    } else if (typeof val === 'string') {
        const parsedInt = parseInt(val, 10);
        return !isNaN(parsedInt) && parsedInt >= 0;
    }
    return false;
};

export const bannerSchema = zod.object({
    countryId: zod.string().optional(),
    bannerTitle: zod.string({ required_error: 'Banner title is required', }).min(2, 'Banner title is should be 2 chars minimum'),
    slug: zod.any().optional(),
    page: zod.string().refine((val) => val.trim().length > 0, {
        message: 'Page must not be empty'
    }),
    description: zod.string().optional(),
    linkType: zod.string().refine((val) => val.trim().length > 0, {
        message: 'Link type must not be empty'
    }),
    link: zod.any().optional(),
    category: zod.string().optional(),
    brand: zod.string().optional(),
    product: zod.string().optional(),
    position: zod.custom((val) => isNonNegativeInteger(val), {
        message: 'Position must be a non-negative integer or a string that can be converted to a non-negative integer'
    }),
    blocks: zod.custom((val) => isNonNegativeInteger(val), {
        message: 'Position must be a non-negative integer or a string that can be converted to a non-negative integer'
    }),
    bannerImages: zod.any({ required_error: 'Slider image is required' }),
    languageValues: zod.any().optional(),
    status: zod.string().optional(),
}).superRefine(({ linkType, product, category, brand, link }, ctx) => {
    if ((linkType === 'category' && (category === ''))) {
        ctx.addIssue({
            code: "custom",
            message: "Category is required when link type is category",
            path: ["category"]
        });
    } else if ((linkType === 'brand') && (brand === '')) {
        ctx.addIssue({
            code: "custom",
            message: "Brand is required when link type is brand",
            path: ["brand"]
        });
    } else if ((linkType === 'product') && (product === '')) {
        ctx.addIssue({
            code: "custom",
            message: "Product is required when link type is product",
            path: ["product"]
        });
    }
});


export const bannerStatusSchema = zod.object({
    status: zod.string()
        .min(1, { message: "Status is required" })
        .max(1, { message: "Status must be a single character" })
        .refine(value => value === "1" || value === "2", {
            message: "Status must be either '1' or '2'"
        })
});

export const bannerPositionSchema = zod.object({
    position: zod.custom((val) => isNonNegativeInteger(val), {
        message: 'Position must be a non-negative integer or a string that can be converted to a non-negative integer'
    }),
});
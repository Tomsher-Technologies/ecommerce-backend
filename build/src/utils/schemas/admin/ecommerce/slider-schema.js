"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sliderPositionSchema = exports.sliderStatusSchema = exports.sliderSchema = void 0;
const zod_1 = require("zod");
const isNonNegativeInteger = (val) => {
    if (typeof val === 'number') {
        return val >= 0 && Number.isInteger(val);
    }
    else if (typeof val === 'string') {
        const parsedInt = parseInt(val, 10);
        return !isNaN(parsedInt) && parsedInt >= 0;
    }
    return false;
};
exports.sliderSchema = zod_1.z.object({
    countryId: zod_1.z.string().optional(),
    sliderTitle: zod_1.z.string({ required_error: 'Slider title is required', }).min(2, 'Slider title is should be 2 chars minimum'),
    slug: zod_1.z.any().optional(),
    page: zod_1.z.string().refine((val) => val.trim().length > 0, {
        message: 'Page must not be empty'
    }),
    pageReference: zod_1.z.string().refine((val) => val.trim().length > 0, {
        message: 'Page reference must not be empty'
    }),
    description: zod_1.z.string().optional(),
    linkType: zod_1.z.string().refine((val) => val.trim().length > 0, {
        message: 'Link type must not be empty'
    }),
    link: zod_1.z.any().optional(),
    category: zod_1.z.string().optional(),
    brand: zod_1.z.string().optional(),
    product: zod_1.z.string().optional(),
    position: zod_1.z.custom((val) => isNonNegativeInteger(val), {
        message: 'Position must be a non-negative integer or a string that can be converted to a non-negative integer'
    }),
    sliderImageUrl: zod_1.z.string().optional(),
    sliderImage: zod_1.z.any({ required_error: 'Slider image is required' }).nullable(),
    languageValues: zod_1.z.any().optional(),
    status: zod_1.z.string().optional(),
}).superRefine(({ linkType, product, category, brand, link }, ctx) => {
    if ((linkType === 'category' && (category === ''))) {
        ctx.addIssue({
            code: "custom",
            message: "Category is required when link type is category",
            path: ["category"]
        });
    }
    else if ((linkType === 'brand') && (brand === '')) {
        ctx.addIssue({
            code: "custom",
            message: "Brand is required when link type is brand",
            path: ["brand"]
        });
    }
    else if ((linkType === 'product') && (product === '')) {
        ctx.addIssue({
            code: "custom",
            message: "Product is required when link type is product",
            path: ["product"]
        });
    }
});
exports.sliderStatusSchema = zod_1.z.object({
    status: zod_1.z.string()
        .min(1, { message: "Status is required" })
        .max(1, { message: "Status must be a single character" })
        .refine(value => value === "1" || value === "2", {
        message: "Status must be either '1' or '2'"
    })
});
exports.sliderPositionSchema = zod_1.z.object({
    position: zod_1.z.custom((val) => isNonNegativeInteger(val), {
        message: 'Position must be a non-negative integer or a string that can be converted to a non-negative integer'
    }),
});

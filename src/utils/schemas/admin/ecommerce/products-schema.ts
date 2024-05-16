import { z as zod } from 'zod';

const countryPricingSchema = zod.object({
    countryID: zod.string().min(1),
    price: zod.number().min(1),
    mainPrice: zod.number().min(1),
    productCost: zod.number().optional(),
    quantity: zod.string().min(1),
    discount: zod.number().optional(),
    discountDateRange: zod.string().optional(),
    variantSku: zod.string({ required_error: 'variantSku is required' }).min(2, 'variantSku should be at least 2 characters long'),
});

export const productsSchema = zod.object({
    productTitle: zod.string({ required_error: 'Product title is required' }).min(2, 'Product title should be at least 2 characters long'),
    description: zod.string({ required_error: 'Description is required' }).min(5, 'Description should be at least 5 characters long'),
    longDescription: zod.string({ required_error: 'Long description is required' }).min(10, 'Long description should be at least 10 characters long'),
    productCategory: zod.any({ required_error: 'Category is required' }),
    brand: zod.string({ required_error: 'Brand is required' }),
    cartMinQuantity: zod.number().optional(),
    cartMaxQuantity: zod.number().optional(),
    isVariant: zod.string({ required_error: 'isVariant is required' }),
    variants: zod
        .any(countryPricingSchema),
    languageValues: zod.any().optional(),
    sku: zod.string({ required_error: 'SKU is required' }).min(2, 'SKU should be at least 2 characters long'),
}).nonstrict();



export const updateWebsitePrioritySchema = zod.object({
    keyColumn: zod.string({ required_error: 'Key column is required', }).min(2, 'Key column is should be 2 chars minimum'),
    root: zod.array(zod.any()).optional(),
    container1: zod.array(zod.any()).optional(),
}).nonstrict();

export const productStatusSchema = zod.object({
    status: zod.string()
        .min(1, { message: "Status is required" })
        .max(1, { message: "Status must be a single character" })
        .refine(value => value === "1" || value === "2", {
            message: "Status must be either '1' or '2'"
        })
});
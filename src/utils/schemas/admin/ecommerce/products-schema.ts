import { z as zod } from 'zod';

const countryPricingSchema = zod.object({
    countryID: zod.string().min(1),
    price: zod.number().min(1),
    mainPrice: zod.number().min(1),
    productCost: zod.number().optional(),
    quantity: zod.string().min(1),
    discount: zod.number().optional(),
    discountDateRange: zod.string().optional(),
});

export const productsSchema = zod.object({
    en_productTitle: zod.string({ required_error: 'Product english title is required' }).min(2, 'Product english title should be at least 2 characters long'),
    ar_productTitle: zod.string({ required_error: 'Product arabic title is required' }).min(2, 'Product arabic title should be at least 2 characters long'),
    description: zod.string({ required_error: 'Description is required' }).min(5, 'Description should be at least 5 characters long'),
    longDescription: zod.string({ required_error: 'Long description is required' }).min(10, 'Long description should be at least 10 characters long'),
    category: zod.string({ required_error: 'Category is required' }),
    brand: zod.string({ required_error: 'Brand is required' }),
    cartMinQuantity: zod.number({ required_error: 'Cart min quantity is required' }),
    cartMaxQuantity: zod.number({ required_error: 'Cart max quantity is required' }),
    isVariant: zod.string({ required_error: 'isVariant is required' }),
    inventryDetails: zod
        .any(countryPricingSchema),
    sku: zod.string({ required_error: 'SKU is required' }).min(2, 'SKU should be at least 2 characters long'),
}).nonstrict();



export const updateWebsitePrioritySchema = zod.object({
    keyColumn: zod.string({ required_error: 'Key column is required', }).min(2, 'Key column is should be 2 chars minimum'),
    root: zod.array(zod.any()).optional(),
    container1: zod.array(zod.any()).optional(),
}).nonstrict();

export const attributeSchema = zod.object({
    attributeTitle: zod.string({ required_error: 'Attribute title is required', }).min(2, 'Attribute title is should be 2 chars minimum'),
    attributeType: zod.string({ required_error: 'Attribute type is required', }).min(2, 'Attribute type is should be 2 chars minimum'),
    attributeValues: zod.array(zod.unknown()).optional(),
    languageValues: zod.any().optional(),
}).nonstrict();
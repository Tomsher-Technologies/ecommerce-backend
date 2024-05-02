import { z as zod} from 'zod';

export const brandSchema = zod.object({
    brandTitle: zod.string({ required_error: 'Brand title is required', }).min(2, 'Brand title is should be 2 chars minimum'),
    categoryId: zod.string({required_error: 'Category is required'}).min(2, { message: 'Category is required' }),
    description: zod.string({ required_error: 'Description is required', }).min(10, 'Description is should be 10 chars minimum'),
    languageValues: zod.any().optional(),
}).nonstrict();

export const updateWebsitePrioritySchema = zod.object({
    keyColumn: zod.string({ required_error: 'Key column is required', }).min(2, 'Key column is should be 2 chars minimum'),
    root: zod.array(zod.any()).optional(),
    container1: zod.array(zod.any()).optional(),
}).nonstrict();
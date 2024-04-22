import { z } from 'zod';

export const subCategorySchema = z.object({
    subCategoryTitle: z.string({ required_error: 'Sub category title is required', }).min(2, 'Sub category title is should be 2 chars minimum'),
    description: z.string({ required_error: 'Description is required', }).min(10, 'Description is should be 10 chars minimum'),
}).nonstrict();
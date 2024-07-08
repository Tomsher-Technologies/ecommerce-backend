import { z as zod } from 'zod';

export const collectionCategorySchema = zod.object({
    countryId: zod.string().optional(),
    collectionTitle: zod.string({ required_error: 'Collection title is required', }).min(3, 'Collection title is should be 3 chars minimum'),
    collectionSubTitle: zod.string().optional(),
    collectionsCategories: zod.any({ required_error: 'Collection categories is required', }),
    page: zod.string().refine((val) => val.trim().length > 0, {
        message: 'Page must not be empty'
    }),
    pageReference: zod.string().refine((val) => val.trim().length > 0, {
        message: 'Page must not be empty'
    }),
    languageValues: zod.any().optional(),
}).nonstrict(); 
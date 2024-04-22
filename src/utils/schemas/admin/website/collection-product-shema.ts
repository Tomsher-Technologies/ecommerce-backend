import { z as zod } from 'zod';

export const collectionProductSchema = zod.object({
    collectionTitle: zod.string({ required_error: 'Collection title is required', }).min(3, 'Collection title is should be 3 chars minimum'),
    collectionSubTitle: zod.string().optional(),
    collectionsProducts: zod.any({ required_error: 'Collection product is required', }),
}).nonstrict(); 
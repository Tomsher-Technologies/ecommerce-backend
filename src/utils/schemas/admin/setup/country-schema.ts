import { z } from 'zod';

export const countrySchema = z.object({
    countryTitle: z.string({ required_error: 'Country title is required', }).min(3, 'Country title is should be 3 chars minimum'),
    countryCode: z.string({ required_error: 'Country code is required', }).min(2, 'Country code is should be 2 chars minimum'),
    currencyCode: z.string({ required_error: 'Currency code is required', }).min(2, 'Currency code is should be 2 chars minimum'),
}).nonstrict(); 
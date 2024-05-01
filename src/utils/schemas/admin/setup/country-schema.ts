import { z as zod} from 'zod';

export const countrySchema = zod.object({
    countryTitle: zod.string({ required_error: 'Country title is required', }).min(3, 'Country title is should be 3 chars minimum'),
    countryCode: zod.string({ required_error: 'Country code is required', }).min(2, 'Country code is should be 2 chars minimum'),
    currencyCode: zod.string({ required_error: 'Currency code is required', }).min(2, 'Currency code is should be 2 chars minimum'),
}).nonstrict(); 
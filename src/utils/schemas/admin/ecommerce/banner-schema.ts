import { z } from 'zod';

export const bannerSchema = z.object({
    bannerTitle: z.string({ required_error: 'Banner title is required', }).min(2, 'Banner title is should be 2 chars minimum'),
    description: z.string({ required_error: 'Description is required', }).min(5, 'Description is should be 5 chars minimum'),
}).nonstrict();
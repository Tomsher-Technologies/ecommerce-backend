import { z as zod } from 'zod';

export const galleryImageSchema = zod.object({
    galleryImageUrl: zod.any({ required_error: 'gallery image is required' }),
    sourceFrom: zod.string().optional(),
    sourceFromId: zod.string().optional(),
    page: zod.string().optional(),
    pageReference: zod.string().optional(),
    status: zod.string().optional(),
}).nonstrict();

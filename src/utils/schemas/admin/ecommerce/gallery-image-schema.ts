import { z as zod } from 'zod';

export const galleryImageSchema = zod.object({
    galleryImageUrl: zod.any({ required_error: 'Slider image is required' }),
    sourceFrom: zod.string().optional(),
    sourceFromId: zod.string().optional(),
    page: zod.string().refine((val) => val.trim().length > 0, {
        message: 'Page must not be empty'
    }),
    pageReference: zod.string().refine((val) => val.trim().length > 0, {
        message: 'Page reference must not be empty'
    }),
    status: zod.string().optional(),
}).nonstrict();

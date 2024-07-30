import { z as zod } from 'zod';

export const newsletterSchema = zod.object({
    email: zod.string({ required_error: 'Email is required', }).email('Please provide a valid email address'),
})
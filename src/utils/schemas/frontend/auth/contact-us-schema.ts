import { z as zod } from 'zod';

export const contactUsSchema = zod.object({
    name: zod.string({ required_error: "Name is required" }).min(1, {
        message: "Name is required"
    }),
    email: zod.string({ required_error: 'Email is required', }).email('Please provide a valid email address'),
    phone: zod.string().refine(value => /^\d+$/.test(value) && value.length >= 9, {
        message: 'Phone number should contain only numbers and be at least 9 digits long',
    }),
    subject: zod.string({ required_error: 'Message is required' })
        .min(3, 'Please enter at least 3 characters for the subject'),
    message: zod.string({ required_error: 'Message is required' })
        .min(3, 'Please enter at least 3 characters for the message'),
})
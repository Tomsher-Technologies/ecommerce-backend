import { z } from 'zod';

export const userSchema = z.object({
    userTypeID: z.string({ required_error: 'User type is required', }),
    email: z.string({ required_error: 'Email is required', }).email('Please provide a valid email address'),
    firstName: z.string({ required_error: 'First name is required', }).min(3, 'First name is should be 3 chars minimum'),
    lastName: z.string().optional(),
    phone: z.string().refine(value => /^\d+$/.test(value) && value.length >= 9, {
        message: 'Phone number should contain only numbers and be at least 9 digits long',
        path: ['phone']
    }),
    password: z.string({ required_error: 'Phone number is required' }).min(6, 'Password too short - should be 6 chars minimum'),
}).nonstrict();
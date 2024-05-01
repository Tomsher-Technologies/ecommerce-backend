import { z as zod } from 'zod';

export const userSchema = zod.object({
    countryId: zod.string({ required_error: 'Country is required', }).min(2, 'Country is should be 2 chars minimum'),
    userTypeID: zod.string({ required_error: 'User type is required', }),
    email: zod.string({ required_error: 'Email is required', }).email('Please provide a valid email address'),
    firstName: zod.string({ required_error: 'First name is required', }).min(3, 'First name is should be 3 chars minimum'),
    lastName: zod.string().optional(),
    phone: zod.string().refine(value => /^\d+$/.test(value) && value.length >= 9, {
        message: 'Phone number should contain only numbers and be at least 9 digits long',
        path: ['phone']
    }),
    password: zod.string({ required_error: 'Phone number is required' }).min(6, 'Password too short - should be 6 chars minimum'),
}).nonstrict();
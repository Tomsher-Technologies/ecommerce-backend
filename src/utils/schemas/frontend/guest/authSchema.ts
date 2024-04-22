import { z as zod } from 'zod';

export const registerSchema = zod.object({
    email: zod.string({ required_error: 'Email is required', }).email('Please provide a valid email address'),
    firstName: zod.string({ required_error: 'First name is required', }).min(3, 'First name is should be 3 chars minimum'),
    phone: zod.string().refine(value => /^\d+$/.test(value) && value.length >= 9, {
        message: 'Phone number should contain only numbers and be at least 9 digits long',
        path: ['phone']
    }),
    password: zod.string({ required_error: 'password is required' }).min(6, 'Password too short - should be 6 chars minimum'),
    confirmPassword: zod.string({ required_error: 'Confirm password is required' }).min(6, 'Password too short - should be 6 chars minimum'),
    // otp: zod.string().min(4, 'OTP is should be 3 chars minimum').max(6, 'OTP is should be 3 chars minimum').optional(),
    // otpExpiry: zod.any().optional(),
}).superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
        ctx.addIssue({
            code: "custom",
            message: "The password and the confirmed password do not match.",
            path: ["category"]
        });
    }
})

export const loginSchema = zod.object({
    email: zod.string({ required_error: 'Email is required', }).email('Please provide a valid email address'),
    password: zod.string({ required_error: 'password is required' }).min(6, 'Password too short - should be 6 chars minimum')
});
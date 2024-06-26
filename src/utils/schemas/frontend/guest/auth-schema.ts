import { z as zod } from 'zod';

export const registerSchema = zod.object({
    email: zod.string({ required_error: 'Email is required', }).email('Please provide a valid email address'),
    otpType: zod.enum(['phone', 'email'], {
        required_error: 'Otp type is required',
        invalid_type_error: 'Otp type must be either "phone" or "email"',
    }),
    firstName: zod.string({ required_error: 'First name is required', }).min(3, 'First name is should be 3 chars minimum'),
    phone: zod.string().refine(value => /^\d+$/.test(value) && value.length >= 9, {
        message: 'Phone number should contain only numbers and be at least 9 digits long',
        path: ['phone']
    }),
    password: zod.string({ required_error: 'password is required' }).min(6, 'Password too short - should be 6 chars minimum'),
    confirmPassword: zod.string({ required_error: 'Confirm password is required' }).min(6, 'Password too short - should be 6 chars minimum'),
    referralCode: zod.string().optional(),
    aggreeWithTermsAndCondions: zod.boolean().refine(value => value === true, { message: 'You must agree with the terms and conditions' }), // Make it required

}).superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
        ctx.addIssue({
            code: "custom",
            message: "The password and the confirmed password do not match.",
            path: ["password"]
        });
    }
})

export const loginSchema = zod.object({
    email: zod.string({ required_error: 'Email is required', }).email('Please provide a valid email address'),
    password: zod.string({ required_error: 'password is required' }).min(6, 'Password too short - should be 6 chars minimum')
});

export const verifyOtpSchema = zod.object({
    otpType: zod.enum(['phone', 'email'], {
        required_error: 'Otp type is required',
        invalid_type_error: 'Otp type must be either "phone" or "email"',
    }),
    otp: zod.string({ required_error: 'Otp  is required' }).min(6, 'Otp  should be 6 chars minimum').max(6, 'Otp  should be 6 chars maximum'),
    email: zod.string({ required_error: 'Email is required' }).email('Please provide a valid email address').optional(),
    phone: zod.string().refine(value => /^\d+$/.test(value) && value.length >= 9, {
        message: 'Phone number should contain only numbers and be at least 9 digits long',
        path: ['phone']
    }).optional(),
}).superRefine(({ otpType, email, phone }, ctx) => {
    if (otpType === 'email') {
        if (!email) {
            ctx.addIssue({
                code: zod.ZodIssueCode.custom,
                message: 'Email is required when otpType is email',
                path: ['email'],
            });
        }
    } else if (otpType === 'phone') {
        if (!phone) {
            ctx.addIssue({
                code: zod.ZodIssueCode.custom,
                message: 'Phone number is required when otpType is phone',
                path: ['phone'],
            });
        }
    }
});
export const resendOtpSchema = zod.object({
    otpType: zod.enum(['phone', 'email'], {
        required_error: 'Otp type is required',
        invalid_type_error: 'Otp type must be either "phone" or "email"',
    }),
    email: zod.string({ required_error: 'Email is required' }).email('Please provide a valid email address').optional(),
    phone: zod.string().refine(value => /^\d+$/.test(value) && value.length >= 9, {
        message: 'Phone number should contain only numbers and be at least 9 digits long',
        path: ['phone']
    }).optional(),
}).superRefine(({ otpType, email, phone }, ctx) => {
    if (otpType === 'email') {
        if (!email) {
            ctx.addIssue({
                code: zod.ZodIssueCode.custom,
                message: 'Email is required when otpType is email',
                path: ['email'],
            });
        }
    } else if (otpType === 'phone') {
        if (!phone) {
            ctx.addIssue({
                code: zod.ZodIssueCode.custom,
                message: 'Phone number is required when otpType is phone',
                path: ['phone'],
            });
        }
    }
});

export const forgotPasswordSchema = zod.object({
    otpType: zod.enum(['phone', 'email'], {
        required_error: 'Otp type is required',
        invalid_type_error: 'Otp type must be either "phone" or "email"',
    }),
    email: zod.string({ required_error: 'Email is required' }).email('Please provide a valid email address').optional(),
    phone: zod.string().refine(value => /^\d+$/.test(value) && value.length >= 9, {
        message: 'Phone number should contain only numbers and be at least 9 digits long',
        path: ['phone']
    }).optional(),
}).superRefine(({ otpType, email, phone }, ctx) => {
    if (otpType === 'email') {
        if (!email) {
            ctx.addIssue({
                code: zod.ZodIssueCode.custom,
                message: 'Email is required when otpType is email',
                path: ['email'],
            });
        }
    } else if (otpType === 'phone') {
        if (!phone) {
            ctx.addIssue({
                code: zod.ZodIssueCode.custom,
                message: 'Phone number is required when otpType is phone',
                path: ['phone'],
            });
        }
    }
});

export const resetPasswordFormSchema = zod.object({
    email: zod.string().email({ message: 'Invalid email address' }).min(5, { message: 'Email address must be at least 5 characters long' }).max(255).refine(value => value.trim() !== '', { message: 'Email address cannot be empty' }),
    otp: zod.string().min(6, { message: 'Otp must be at least 6 characters long' }).max(6).refine(value => value.trim() !== '', { message: 'Otp address cannot be empty' }),
    password: zod.string().min(6, { message: 'Password must be at least 6 characters long' }),
    confirmPassword: zod.string().min(6, { message: 'Confirm password must be at least 6 characters long' }),
}).superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
        ctx.addIssue({
            code: "custom",
            message: "Password and confirm password must be the same",
            path: ["confirmPassword"]
        });
    }
});
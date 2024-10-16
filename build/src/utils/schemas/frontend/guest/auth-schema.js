"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidEmail = exports.resetPasswordFormSchema = exports.forgotPasswordSchema = exports.resendOtpSchema = exports.verifyOtpSchema = exports.loginSchema = exports.guestRegisterSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string({ required_error: 'Email is required', }).email('Please provide a valid email address'),
    otpType: zod_1.z.enum(['phone', 'email'], {
        required_error: 'Otp type is required',
        invalid_type_error: 'Otp type must be either "phone" or "email"',
    }),
    firstName: zod_1.z.string({ required_error: 'First name is required', }).min(2, 'First name is should be 2 chars minimum').refine(value => /^[A-Za-z\s]+$/.test(value), { message: 'Name should contain only alphabetic characters ' }),
    phone: zod_1.z.string().min(7, { message: 'Phone number must be at least 8 characters long' }).max(15).refine(value => value.trim() !== '', { message: 'Phone number cannot be empty' }).refine(value => /^[0-9]+$/.test(value), { message: 'Phone number must contain only numerals' }),
    password: zod_1.z.string({ required_error: 'password is required' }).min(6, 'Password too short - should be 6 chars minimum'),
    confirmPassword: zod_1.z.string({ required_error: 'Confirm password is required' }).min(6, 'Password too short - should be 6 chars minimum'),
    referralCode: zod_1.z.string().optional(),
    aggreeWithTermsAndCondions: zod_1.z.boolean().refine(value => value === true, { message: 'You must agree with the terms and conditions' }), // Make it required
}).superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
        ctx.addIssue({
            code: "custom",
            message: "The password and the confirmed password do not match.",
            path: ["password"]
        });
    }
});
exports.guestRegisterSchema = zod_1.z.object({
    email: zod_1.z.string({ required_error: 'Email is required', }).email('Please provide a valid email address'),
    otpType: zod_1.z.enum(['phone', 'email'], {
        required_error: 'Otp type is required',
        invalid_type_error: 'Otp type must be either "phone" or "email"',
    }),
    phone: zod_1.z.string().min(7, { message: 'Phone number must be at least 8 characters long' }).max(15).refine(value => value.trim() !== '', { message: 'Phone number cannot be empty' }).refine(value => /^[0-9]+$/.test(value), { message: 'Phone number must contain only numerals' }),
    notRequiredOtp: zod_1.z.boolean().optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string({ required_error: 'Email is required', }).email('Please provide a valid email address'),
    password: zod_1.z.string({ required_error: 'password is required' }).min(6, 'Password too short - should be 6 chars minimum')
});
exports.verifyOtpSchema = zod_1.z.object({
    otpType: zod_1.z.enum(['phone', 'email'], {
        required_error: 'Otp type is required',
        invalid_type_error: 'Otp type must be either "phone" or "email"',
    }),
    otp: zod_1.z.string({ required_error: 'Otp  is required' }).min(4, 'Otp  should be 6 chars minimum').max(6, 'Otp  should be 6 chars maximum'),
    email: zod_1.z.string({ required_error: 'Email is required' }).email('Please provide a valid email address').optional(),
    phone: zod_1.z.string().refine(value => /^\d+$/.test(value) && value.length >= 8, {
        message: 'Phone number should contain only numbers and be at least 8 digits long',
    }).optional(),
}).superRefine(({ otpType, email, phone }, ctx) => {
    if (otpType === 'email') {
        if (!email) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: 'Email is required when otpType is email',
                path: ['email'],
            });
        }
    }
    else if (otpType === 'phone') {
        if (!phone) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: 'Phone number is required when otpType is phone',
                path: ['phone'],
            });
        }
    }
});
exports.resendOtpSchema = zod_1.z.object({
    otpType: zod_1.z.enum(['phone', 'email'], {
        required_error: 'Otp type is required',
        invalid_type_error: 'Otp type must be either "phone" or "email"',
    }),
    email: zod_1.z.string({ required_error: 'Email is required' }).email('Please provide a valid email address').optional(),
    phone: zod_1.z.string().refine(value => /^\d+$/.test(value) && value.length >= 8, {
        message: 'Phone number should contain only numbers and be at least 8 digits long',
        path: ['phone']
    }).optional(),
}).superRefine(({ otpType, email, phone }, ctx) => {
    if (otpType === 'email') {
        if (!email) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: 'Email is required when otpType is email',
                path: ['email'],
            });
        }
    }
    else if (otpType === 'phone') {
        if (!phone) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: 'Phone number is required when otpType is phone',
                path: ['phone'],
            });
        }
    }
});
exports.forgotPasswordSchema = zod_1.z.object({
    otpType: zod_1.z.enum(['phone', 'email'], {
        required_error: 'Otp type is required',
        invalid_type_error: 'Otp type must be either "phone" or "email"',
    }),
    email: zod_1.z.string({ required_error: 'Email is required' }).email('Please provide a valid email address').optional(),
    phone: zod_1.z.string().refine(value => /^\d+$/.test(value) && value.length >= 8, {
        message: 'Phone number should contain only numbers and be at least 8 digits long',
        path: ['phone']
    }).optional(),
}).superRefine(({ otpType, email, phone }, ctx) => {
    if (otpType === 'email') {
        if (!email) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: 'Email is required when otpType is email',
                path: ['email'],
            });
        }
    }
    else if (otpType === 'phone') {
        if (!phone) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: 'Phone number is required when otpType is phone',
                path: ['phone'],
            });
        }
    }
});
exports.resetPasswordFormSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: 'Invalid email address' }).min(5, { message: 'Email address must be at least 5 characters long' }).max(255).refine(value => value.trim() !== '', { message: 'Email address cannot be empty' }),
    otp: zod_1.z.string().min(4, { message: 'Otp must be at least 6 characters long' }).max(6).refine(value => value.trim() !== '', { message: 'Otp address cannot be empty' }),
    password: zod_1.z.string().min(6, { message: 'Password must be at least 6 characters long' }),
    confirmPassword: zod_1.z.string().min(6, { message: 'Confirm password must be at least 6 characters long' }),
}).superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
        ctx.addIssue({
            code: "custom",
            message: "Password and confirm password must be the same",
            path: ["confirmPassword"]
        });
    }
});
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactUsSchema = void 0;
const zod_1 = require("zod");
exports.contactUsSchema = zod_1.z.object({
    name: zod_1.z.string({ required_error: "Name is required" }).min(1, {
        message: "Name is required"
    }),
    email: zod_1.z.string({ required_error: 'Email is required', }).email('Please provide a valid email address'),
    phone: zod_1.z.string().refine(value => /^\d+$/.test(value) && value.length >= 8, {
        message: 'Phone number should contain only numbers and be at least 8 digits long',
    }),
    subject: zod_1.z.string({ required_error: 'Message is required' })
        .min(3, 'Please enter at least 3 characters for the subject'),
    message: zod_1.z.string({ required_error: 'Message is required' })
        .min(3, 'Please enter at least 3 characters for the message'),
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSchema = void 0;
const zod_1 = require("zod");
exports.userSchema = zod_1.z.object({
    countryId: zod_1.z.string().optional(),
    userTypeID: zod_1.z.string({ required_error: 'User type is required', }),
    email: zod_1.z.string({ required_error: 'Email is required', }).email('Please provide a valid email address'),
    firstName: zod_1.z.string({ required_error: 'First name is required', }).min(3, 'First name is should be 3 chars minimum'),
    lastName: zod_1.z.string().optional(),
    phone: zod_1.z.string()
        .regex(/^\d{9,}$/, 'Phone number should contain only numbers and be at least 9 digits long'),
    password: zod_1.z.string({ required_error: 'Phone number is required' }).min(6, 'Password too short - should be 6 chars minimum'),
}).nonstrict();

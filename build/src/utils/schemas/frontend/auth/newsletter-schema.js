"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newsletterSchema = void 0;
const zod_1 = require("zod");
exports.newsletterSchema = zod_1.z.object({
    email: zod_1.z.string({ required_error: 'Email is required', }).email('Please provide a valid email address'),
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taxStatusSchema = exports.taxSchema = void 0;
const zod_1 = require("zod");
exports.taxSchema = zod_1.z.object({
    taxTitle: zod_1.z.string({ required_error: 'Tax title is required', }).min(3, 'Tax title is should be 3 chars minimum'),
    taxPercentage: zod_1.z.string({ required_error: 'Tax percentage is required', }).min(2, 'Tax percentage is should be 2 chars minimum'),
}).nonstrict();
exports.taxStatusSchema = zod_1.z.object({
    status: zod_1.z.string()
        .min(1, { message: "Status is required" })
        .max(1, { message: "Status must be a single character" })
        .refine(value => value === "1" || value === "2", {
        message: "Status must be either '1' or '2'"
    })
});

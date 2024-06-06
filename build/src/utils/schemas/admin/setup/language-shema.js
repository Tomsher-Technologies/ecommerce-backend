"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.languageStatusSchema = exports.languageSchema = void 0;
const zod_1 = require("zod");
exports.languageSchema = zod_1.z.object({
    languageTitle: zod_1.z.string({ required_error: 'Language title is required', }).min(3, 'Language title is should be 3 chars minimum'),
    languageCode: zod_1.z.string({ required_error: 'Language code is required', }).min(2, 'Language code is should be 2 chars minimum'),
}).nonstrict();
exports.languageStatusSchema = zod_1.z.object({
    status: zod_1.z.string()
        .min(1, { message: "Status is required" })
        .max(1, { message: "Status must be a single character" })
        .refine(value => value === "1" || value === "2", {
        message: "Status must be either '1' or '2'"
    })
});

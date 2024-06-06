"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countryStatusSchema = exports.countrySchema = void 0;
const zod_1 = require("zod");
exports.countrySchema = zod_1.z.object({
    countryTitle: zod_1.z.string({ required_error: 'Country title is required', }).min(3, 'Country title is should be 3 chars minimum'),
    countryCode: zod_1.z.string({ required_error: 'Country code is required', }).min(2, 'Country code is should be 2 chars minimum'),
    currencyCode: zod_1.z.string({ required_error: 'Currency code is required', }).min(2, 'Currency code is should be 2 chars minimum'),
    countryShortTitle: zod_1.z.string({ required_error: 'Country Short title is required', }).min(2, 'Currency code is should be 2 chars minimum'),
    isOrigin: zod_1.z.boolean().optional()
}).nonstrict();
exports.countryStatusSchema = zod_1.z.object({
    status: zod_1.z.string()
        .min(1, { message: "Status is required" })
        .max(1, { message: "Status must be a single character" })
        .refine(value => value === "1" || value === "2", {
        message: "Status must be either '1' or '2'"
    })
});

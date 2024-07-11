"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attributeStatusSchema = exports.attributeSchema = void 0;
const zod_1 = require("zod");
exports.attributeSchema = zod_1.z.object({
    attributeTitle: zod_1.z.string({ required_error: 'Attribute title is required', }).min(2, 'Attribute title is should be 2 chars minimum'),
    attributeType: zod_1.z.string({ required_error: 'Attribute type is required', }).min(2, 'Attribute type is should be 2 chars minimum'),
    attributeValues: zod_1.z.array(zod_1.z.unknown()).optional(),
    languageValues: zod_1.z.any().optional(),
    status: zod_1.z.string().optional(),
}).nonstrict();
exports.attributeStatusSchema = zod_1.z.object({
    status: zod_1.z.string()
        .min(1, { message: "Status is required" })
        .max(1, { message: "Status must be a single character" })
        .refine(value => value === "1" || value === "2", {
        message: "Status must be either '1' or '2'"
    })
});

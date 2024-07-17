"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.specificationStatusSchema = exports.specificationSchema = void 0;
const zod_1 = require("zod");
exports.specificationSchema = zod_1.z.object({
    specificationTitle: zod_1.z.string({ required_error: 'Specification title is required', }).min(2, 'Specification title is should be 2 chars minimum'),
    specificationDisplayName: zod_1.z.string().optional(),
    SpecificationValues: zod_1.z.array(zod_1.z.unknown()).optional(),
    languageValues: zod_1.z.any().optional(),
}).nonstrict();
exports.specificationStatusSchema = zod_1.z.object({
    status: zod_1.z.string()
        .min(1, { message: "Status is required" })
        .max(1, { message: "Status must be a single character" })
        .refine(value => value === "1" || value === "2", {
        message: "Status must be either '1' or '2'"
    })
});

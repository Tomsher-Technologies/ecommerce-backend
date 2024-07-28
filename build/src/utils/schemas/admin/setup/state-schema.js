"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stateStatusSchema = exports.stateSchema = void 0;
const zod_1 = require("zod");
exports.stateSchema = zod_1.z.object({
    countryId: zod_1.z.string({ required_error: 'country id is required', }),
    stateTitle: zod_1.z.string({ required_error: 'State title is required', }).min(3, 'State title is should be 3 chars minimum'),
}).nonstrict();
exports.stateStatusSchema = zod_1.z.object({
    status: zod_1.z.string()
        .min(1, { message: "Status is required" })
        .max(1, { message: "Status must be a single character" })
        .refine(value => value === "1" || value === "2", {
        message: "Status must be either '1' or '2'"
    })
});

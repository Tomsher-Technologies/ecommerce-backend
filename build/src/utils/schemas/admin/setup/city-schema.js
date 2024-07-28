"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cityStatusSchema = exports.citySchema = void 0;
const zod_1 = require("zod");
exports.citySchema = zod_1.z.object({
    countryId: zod_1.z.string({ required_error: 'country id is required', }),
    stateId: zod_1.z.string({ required_error: 'state id is required', }),
    cityTitle: zod_1.z.string({ required_error: 'City title is required', }).min(3, 'City title is should be 3 chars minimum'),
}).nonstrict();
exports.cityStatusSchema = zod_1.z.object({
    status: zod_1.z.string()
        .min(1, { message: "Status is required" })
        .max(1, { message: "Status must be a single character" })
        .refine(value => value === "1" || value === "2", {
        message: "Status must be either '1' or '2'"
    })
});

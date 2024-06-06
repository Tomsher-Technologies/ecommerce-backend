"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.warehouseStatusSchema = exports.warehouseSchema = void 0;
const zod_1 = require("zod");
exports.warehouseSchema = zod_1.z.object({
    warehouseTitle: zod_1.z.string({ required_error: 'Warehouse titleis required', }).min(3, 'Warehouse titleis should be 3 chars minimum'),
    warehouseLocation: zod_1.z.string({ required_error: 'Warehouse location is required', }).min(2, 'Warehouse location is should be 2 chars minimum'),
    deliveryDays: zod_1.z.number({ required_error: 'Delivery delay days is required', }),
    deliveryDelayDays: zod_1.z.number({ required_error: 'Delivery delay days is required', }),
    status: zod_1.z.string().optional()
}).nonstrict();
exports.warehouseStatusSchema = zod_1.z.object({
    status: zod_1.z.string()
        .min(1, { message: "Status is required" })
        .max(1, { message: "Status must be a single character" })
        .refine(value => value === "1" || value === "2", {
        message: "Status must be either '1' or '2'"
    })
});

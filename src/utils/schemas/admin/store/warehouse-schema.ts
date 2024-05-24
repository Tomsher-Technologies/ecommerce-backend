import { z as zod } from 'zod';

export const warehouseSchema = zod.object({
    warehouseTitle: zod.string({ required_error: 'Warehouse titleis required', }).min(3, 'Warehouse titleis should be 3 chars minimum'),
    warehouseLocation: zod.string({ required_error: 'Warehouse location is required', }).min(2, 'Warehouse location is should be 2 chars minimum'),
    deliveryDays: zod.number({ required_error: 'Delivery delay days is required', }),
    deliveryDelayDays: zod.number({ required_error: 'Delivery delay days is required', }),
    status: zod.string().optional()
}).nonstrict(); 


export const warehouseStatusSchema = zod.object({
    status: zod.string()
        .min(1, { message: "Status is required" })
        .max(1, { message: "Status must be a single character" })
        .refine(value => value === "1" || value === "2", {
            message: "Status must be either '1' or '2'"
        })
});
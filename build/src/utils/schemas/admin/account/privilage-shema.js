"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.privilageSchema = void 0;
const zod_1 = require("zod");
const menuKeySchema = zod_1.z.object({
    readOnly: zod_1.z.number().nonnegative('Read only value must be non-negative'),
    writeOnly: zod_1.z.number().nonnegative('Write only value must be non-negative'),
    deleteOnly: zod_1.z.number().nonnegative('Delete only value must be non-negative')
});
const privilageItemSchema = zod_1.z.object({
    privilageValue: zod_1.z.string().nonempty('Privilage value is required'),
    privilageLabel: zod_1.z.string().nonempty('Privilage label is required'),
    menuKey: menuKeySchema
});
const menuItemSchema = zod_1.z.object({
    menuValue: zod_1.z.string().nonempty('Menu value is required'),
    label: zod_1.z.string().nonempty('Label is required'),
    privilageItems: zod_1.z.array(privilageItemSchema)
});
exports.privilageSchema = zod_1.z.object({
    userTypeId: zod_1.z.string().nonempty('User type is required'),
    menuItems: zod_1.z.array(menuItemSchema),
    status: zod_1.z.string().nonempty('Status is required')
}).nonstrict();

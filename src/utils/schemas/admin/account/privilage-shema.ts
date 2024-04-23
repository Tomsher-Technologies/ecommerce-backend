import { z as zod } from 'zod';

const menuKeySchema = zod.object({
    readOnly: zod.number().nonnegative('Read only value must be non-negative'),
    writeOnly: zod.number().nonnegative('Write only value must be non-negative'),
    deleteOnly: zod.number().nonnegative('Delete only value must be non-negative')
});

const privilageItemSchema = zod.object({
    privilageValue: zod.string().nonempty('Privilage value is required'),
    privilageLabel: zod.string().nonempty('Privilage label is required'),
    menuKey: menuKeySchema
});

const menuItemSchema = zod.object({
    menuValue: zod.string().nonempty('Menu value is required'),
    label: zod.string().nonempty('Label is required'),
    privilageItems: zod.array(privilageItemSchema)
});

export const privilageSchema = zod.object({
    userTypeId: zod.string().nonempty('User type is required'),
    menuItems: zod.array(menuItemSchema),
    status: zod.string().nonempty('Status is required')
}).nonstrict();


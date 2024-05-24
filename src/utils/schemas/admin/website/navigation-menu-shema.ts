import { z as zod } from 'zod';

export const navigationMenutSchema = zod.object({
    websiteSetupId: zod.string().optional(),
    languageId: zod.string().optional(),
    deviceType: zod.string({ required_error: 'Device type is required', }).min(3, 'Device type is should be 3 chars minimum'),
    blockValues: zod.array(zod.unknown()),
    // blockValues: zod.object({
    //     id: zod.string().optional(),
    //     level: zod.string().optional(),
    //     countryId: zod.string({ required_error: 'Country is required', }).min(2, 'Country is should be 2 chars minimum'),
    //     menuTitle: zod.string({ required_error: 'Menu title is required', }).min(3, 'Menu title is should be 3 chars minimum'),
    //     deviceType: zod.string({ required_error: 'Device type is required', }).min(3, 'Device type is should be 3 chars minimum'),
    //     menuType: zod.string({ required_error: 'Menu type is required', }).min(3, 'Menu type is should be 3 chars minimum'),
    //     linkedMenuItemName: zod.string().optional(),
    //     linkedMenuItemId: zod.string().optional(),
    //     customeLink: zod.string().optional(),
    //     multiFiles: zod.any().optional(),
    // }),

    status: zod.string().optional(),
    languageValues: zod.any().optional(),
});
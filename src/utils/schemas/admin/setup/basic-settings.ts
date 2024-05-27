import { z as zod } from 'zod';
// form zod validation schema
export const settingsFormSchema = zod.object({
    websiteSetupId: zod.string().optional(),
    languageId: zod.string().optional(),
    blockReference: zod.string({ required_error: 'Block reference is required', }).min(2, 'Block reference is should be 3 chars minimum'),
    block: zod.string({ required_error: 'Block is required', }).min(2, 'Block is should be 3 chars minimum'),
    blockValues: zod.any(zod.unknown()),
    // primaryColor: zod.string({ required_error: 'Primary color is required', }).min(6, 'Hex code is should be 3 chars minimum'),
    // secondaryColor: zod.string({ required_error: 'Secondary color is required', }).min(6, 'Hex code is should be 3 chars minimum'),
    // websiteLogo: zod.any().optional(),
    // websiteLogoUrl: zod.string().optional(),
    // favIcon: zod.any().optional(),
    // favIconUrl: zod.string().optional(),
    status: zod.string().optional(),
});
import { z as zod } from 'zod';
// form zod validation schema
export const pagesFormSchema = zod.object({
    websiteSetupId: zod.string().optional(),
    languageId: zod.string().optional(),
    blockReference: zod.string({ required_error: 'Block reference is required', }).min(2, 'Block reference is should be 3 chars minimum'),
    block: zod.string({ required_error: 'Block is required', }).min(2, 'Block is should be 3 chars minimum'),
    blockValues: zod.any(zod.unknown()),
    languageValues: zod.any().optional(),
    languageSources: zod.string().optional(),
    status: zod.string().optional(),
});
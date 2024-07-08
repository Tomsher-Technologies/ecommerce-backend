"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsFormSchema = void 0;
const zod_1 = require("zod");
// form zod validation schema
exports.settingsFormSchema = zod_1.z.object({
    websiteSetupId: zod_1.z.string().optional(),
    languageId: zod_1.z.string().optional(),
    blockReference: zod_1.z.string({ required_error: 'Block reference is required', }).min(2, 'Block reference is should be 3 chars minimum'),
    block: zod_1.z.string({ required_error: 'Block is required', }).min(2, 'Block is should be 3 chars minimum'),
    blockValues: zod_1.z.any(zod_1.z.unknown()),
    languageValues: zod_1.z.any().optional(),
    languageSources: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
});

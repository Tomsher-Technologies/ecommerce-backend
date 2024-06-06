"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectionProductSchema = void 0;
const zod_1 = require("zod");
exports.collectionProductSchema = zod_1.z.object({
    countryId: zod_1.z.string().optional(),
    collectionTitle: zod_1.z.string({ required_error: 'Collection title is required', }).min(3, 'Collection title is should be 3 chars minimum'),
    collectionSubTitle: zod_1.z.string().optional(),
    collectionsProducts: zod_1.z.any({ required_error: 'Collection product is required', }),
    page: zod_1.z.string().refine((val) => val.trim().length > 0, {
        message: 'Page must not be empty'
    }),
    pageReference: zod_1.z.string().refine((val) => val.trim().length > 0, {
        message: 'Page Reference must not be empty'
    }),
    languageValues: zod_1.z.any().optional(),
}).nonstrict();

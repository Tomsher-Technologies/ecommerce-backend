"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.galleryImageSchema = void 0;
const zod_1 = require("zod");
exports.galleryImageSchema = zod_1.z.object({
    galleryImageUrl: zod_1.z.any({ required_error: 'gallery image is required' }),
    sourceFrom: zod_1.z.string().optional(),
    sourceFromId: zod_1.z.string().optional(),
    page: zod_1.z.string().optional(),
    pageReference: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
}).nonstrict();

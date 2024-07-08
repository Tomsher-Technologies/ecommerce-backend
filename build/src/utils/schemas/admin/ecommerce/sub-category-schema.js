"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subCategorySchema = void 0;
const zod_1 = require("zod");
exports.subCategorySchema = zod_1.z.object({
    subCategoryTitle: zod_1.z.string({ required_error: 'Sub category title is required', }).min(2, 'Sub category title is should be 2 chars minimum'),
    description: zod_1.z.string({ required_error: 'Description is required', }).min(10, 'Description is should be 10 chars minimum'),
}).nonstrict();

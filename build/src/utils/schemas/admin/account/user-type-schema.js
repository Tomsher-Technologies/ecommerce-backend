"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usertypeSchema = void 0;
const zod_1 = require("zod");
exports.usertypeSchema = zod_1.z.object({
    userTypeName: zod_1.z.string({ required_error: 'User type namess is required', }).min(2, 'User type name is should be 2 chars minimum'),
}).nonstrict();

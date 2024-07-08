import { z } from 'zod';

export const usertypeSchema = z.object({
    userTypeName: z.string({ required_error: 'User type namess is required', }).min(2, 'User type name is should be 2 chars minimum'),
}).nonstrict();
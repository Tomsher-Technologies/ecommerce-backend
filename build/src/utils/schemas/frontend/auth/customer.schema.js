"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerAddressSchema = exports.changePassword = exports.updateCustomerSchema = void 0;
const zod_1 = require("zod");
const customer_1 = require("../../../../constants/customer");
const objectIdSchema = zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");
function enumListString(enumValues) {
    return enumValues.map(value => `"${value}"`).join(', ');
}
exports.updateCustomerSchema = zod_1.z.object({
    email: zod_1.z.string({ required_error: 'Email is required', }).email('Please provide a valid email address'),
    firstName: zod_1.z.string({ required_error: 'First name is required', }).min(3, 'First name is should be 3 chars minimum'),
    phone: zod_1.z.string().refine(value => /^\d+$/.test(value) && value.length >= 9, {
        message: 'Phone number should contain only numbers and be at least 9 digits long',
        path: ['phone']
    }),
});
exports.changePassword = zod_1.z.object({
    oldPassword: zod_1.z.string({ required_error: 'New password is required' }).min(6, 'New Password too short - should be 6 chars minimum'),
    newPassword: zod_1.z.string({ required_error: 'New password is required' }).min(6, 'New Password too short - should be 6 chars minimum'),
    confirmNewPassword: zod_1.z.string({ required_error: 'Confirm new password is required' }).min(6, 'Confirm new Password too short - should be 6 chars minimum'),
}).superRefine(({ newPassword, confirmNewPassword }, ctx) => {
    if (newPassword !== confirmNewPassword) {
        ctx.addIssue({
            code: "custom",
            message: "The password and the confirmed password do not match.",
            path: ["newPassword"]
        });
    }
});
exports.customerAddressSchema = zod_1.z.object({
    addressId: zod_1.z.string().optional(),
    country: zod_1.z.string({ required_error: "Country is required" }).min(1, {
        message: "Country is required",
    }),
    addressType: zod_1.z.enum(customer_1.ADDRESS_TYPES, {
        required_error: 'Address type is required',
        invalid_type_error: `Address type must be one of the following: ${enumListString(customer_1.ADDRESS_TYPES)}`,
    }),
    defaultAddress: zod_1.z.boolean().optional(),
    addressMode: zod_1.z.enum(customer_1.ADDRESS_MODES, {
        required_error: 'Address mode is required',
        invalid_type_error: `Address mode must be one of the following: ${enumListString(customer_1.ADDRESS_MODES)}`,
    }),
    name: zod_1.z.string({ required_error: "Name is required" }).min(1, {
        message: "Name is required"
    }),
    address1: zod_1.z.string({ required_error: "Address line 1 is required" }).min(1, {
        message: "Address line 1 is required"
    }),
    address2: zod_1.z.string().optional(),
    phoneNumber: zod_1.z.string({ required_error: "Phone number is required" }).regex(/^\d{10}$/, {
        message: "Phone number must be 10 digits",
    }),
    landlineNumber: zod_1.z.string().optional(),
    state: zod_1.z.string({ required_error: "State is required" }).min(1, {
        message: "State is required"
    }),
    city: zod_1.z.string({ required_error: "City is required" }).min(1, {
        message: "City is required"
    }),
    street: zod_1.z.string().optional(),
    zipCode: zod_1.z.string({ required_error: "City is required" }).min(4, {
        message: "City is required and min 4 chars"
    }),
    longitude: zod_1.z.union([
        zod_1.z.number().min(-180).max(180, { message: "Invalid longitude; must be between -180 and 180 degrees" }),
        zod_1.z.string().regex(/^(\-?\d{1,3}(\.\d+)?)$/, { message: "Invalid longitude format" })
    ]),
    latitude: zod_1.z.union([
        zod_1.z.number().min(-90).max(90, { message: "Invalid latitude; must be between -90 and 90 degrees" }),
        zod_1.z.string().regex(/^(\-?\d{1,2}(\.\d+)?)$/, { message: "Invalid latitude format" })
    ]),
    status: zod_1.z.string().optional(),
});

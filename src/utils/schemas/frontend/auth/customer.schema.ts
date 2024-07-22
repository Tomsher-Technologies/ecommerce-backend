import { z as zod } from 'zod';

import { ADDRESS_MODES, ADDRESS_TYPES } from '../../../../constants/customer';

const objectIdSchema = zod.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

function enumListString(enumValues: readonly string[]): string {
    return enumValues.map(value => `"${value}"`).join(', ');
}


export const updateCustomerSchema = zod.object({
    email: zod.string({ required_error: 'Email is required', }).email('Please provide a valid email address'),
    firstName: zod.string({ required_error: 'First name is required', }).min(3, 'First name is should be 3 chars minimum'),
    phone: zod.string().refine(value => /^\d+$/.test(value) && value.length >= 9, {
        message: 'Phone number should contain only numbers and be at least 9 digits long',
    }),

});


export const changePassword = zod.object({
    oldPassword: zod.string({ required_error: 'New password is required' }).min(6, 'New Password too short - should be 6 chars minimum'),
    newPassword: zod.string({ required_error: 'New password is required' }).min(6, 'New Password too short - should be 6 chars minimum'),
    confirmNewPassword: zod.string({ required_error: 'Confirm new password is required' }).min(6, 'Confirm new Password too short - should be 6 chars minimum'),

}).superRefine(({ newPassword, confirmNewPassword }, ctx) => {
    if (newPassword !== confirmNewPassword) {
        ctx.addIssue({
            code: "custom",
            message: "The password and the confirmed password do not match.",
            path: ["newPassword"]
        });
    }
})


export const customerAddressSchema = zod.object({
    addressId: zod.string().optional(),
    country: zod.string({ required_error: "Country is required" }).min(1, {
        message: "Country is required",
    }),
    addressType: zod.enum(ADDRESS_TYPES, {
        required_error: 'Address type is required',
        invalid_type_error: `Address type must be one of the following: ${enumListString(ADDRESS_TYPES)}`,
    }),
    defaultAddress: zod.boolean().optional(),
    addressMode: zod.enum(ADDRESS_MODES, {
        required_error: 'Address mode is required',
        invalid_type_error: `Address mode must be one of the following: ${enumListString(ADDRESS_MODES)}`,
    }),
    name: zod.string({ required_error: "Name is required" }).min(1, {
        message: "Name is required"
    }),
    address1: zod.string({ required_error: "Address line 1 is required" }).min(1, {
        message: "Address line 1 is required"
    }),
    address2: zod.string().optional(),
    phoneNumber: zod.string({ required_error: "Phone number is required" }).regex(/^\d{9,}$/, {
        message: "Phone number must be at least 9 digits",
    }),
    landlineNumber: zod.string().optional(),
    state: zod.string({ required_error: "State is required" }).min(1, {
        message: "State is required"
    }),
    city: zod.string({ required_error: "City is required" }).min(1, {
        message: "City is required"
    }),
    street: zod.string().optional(),
    zipCode: zod.string().optional(),
    longitude: zod.union([
        zod.number().min(-180).max(180, { message: "Invalid longitude; must be between -180 and 180 degrees" }),
        zod.string().regex(/^(\-?\d{1,3}(\.\d+)?)$/, { message: "Please select the address" })
    ]).optional(),
    latitude: zod.union([
        zod.number().min(-90).max(90, { message: "Invalid latitude; must be between -90 and 90 degrees" }),
        zod.string().regex(/^(\-?\d{1,2}(\.\d+)?)$/, { message: "Please select the address" })
    ]).optional(),
    status: zod.string().optional(),
}).refine((data) => data.longitude !== undefined || data.latitude !== undefined, {
    message: "Please select the address (either longitude or latitude must be provided)",
    path: ["longitude"], // This will set the error on the longitude field
});


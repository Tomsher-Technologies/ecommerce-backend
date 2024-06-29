"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.smsGatwayDefaultValues = void 0;
const smsGatwayDefaultValues = (username, password, sender, customer) => {
    return {
        username,
        password,
        sender,
        recipient: customer.phone,
        message: 'Dear ..., OTP for our registration in timehouse is ' + customer.otp + '. Keep this as confidential.',
    };
};
exports.smsGatwayDefaultValues = smsGatwayDefaultValues;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordOtp = exports.resendOtp = exports.guestRegisterOtp = exports.registerOtp = exports.subjects = void 0;
exports.subjects = {
    passwordResetConfirmation: 'Password Reset Confirmation',
    verificationOTP: 'Verification OTP',
    resentVerificationOTP: 'Resent verification OTP',
};
const registerOtp = (shopName, otp) => {
    return `Welcome to ${shopName}! Your OTP for registration is ${otp}. Please enter this code to complete your signup.`;
};
exports.registerOtp = registerOtp;
const guestRegisterOtp = (shopName, otp) => {
    return `Welcome to ${shopName}! Your OTP for guest registration is ${otp}. Please enter this code to complete your guest chekcout.`;
};
exports.guestRegisterOtp = guestRegisterOtp;
const resendOtp = (otp) => {
    return `Your OTP is ${otp}. Please use this code to complete your verification.`;
};
exports.resendOtp = resendOtp;
const resetPasswordOtp = (otp) => {
    return `Your OTP for password reset is: ${otp}. Please use this code to proceed with resetting your password.`;
};
exports.resetPasswordOtp = resetPasswordOtp;

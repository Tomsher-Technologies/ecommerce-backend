

export const subjects = {
    passwordResetConfirmation: 'Password Reset Confirmation',
    verificationOTP: 'Verification OTP',
    resentVerificationOTP: 'Resent verification OTP',
}


export const registerOtp = (shopName: string, otp: number) => {
    return `Welcome to ${shopName}! Your OTP for registration is ${otp}. Please enter this code to complete your signup.`
}

export const guestRegisterOtp = (shopName: string, otp: number) => {
    return `Welcome to ${shopName}! Your OTP for guest registration is ${otp}. Please enter this code to complete your guest chekcout.`
}

export const resendOtp = ( otp: number) => {
    return `Your OTP is ${otp}. Please use this code to complete your verification.`
}

export const resetPasswordOtp = ( otp: number) => {
    return `Your OTP for password reset is: ${otp}. Please use this code to proceed with resetting your password.`
}
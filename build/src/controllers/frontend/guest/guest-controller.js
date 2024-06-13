"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authSchema_1 = require("../../../utils/schemas/frontend/guest/authSchema");
const helpers_1 = require("../../../utils/helpers");
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const customer_service_1 = __importDefault(require("../../../services/frontend/customer-service"));
const customers_model_1 = __importDefault(require("../../../model/frontend/customers-model"));
const common_service_1 = __importDefault(require("../../../services/frontend/guest/common-service"));
const customer_wallet_transaction_model_1 = __importDefault(require("../../../model/frontend/customer-wallet-transaction-model"));
const controller = new base_controller_1.default();
class GuestController extends base_controller_1.default {
    async register(req, res) {
        try {
            const validatedData = authSchema_1.registerSchema.safeParse(req.body);
            if (validatedData.success) {
                const { email, firstName, phone, password, referralCode } = validatedData.data;
                let referralCodeWithCustomerData = null;
                if (referralCode) {
                    referralCodeWithCustomerData = await customer_service_1.default.findOne({ referralCode: referralCode, status: '1' });
                    if (!referralCodeWithCustomerData) {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Invalid referral code! Please try again',
                        });
                    }
                }
                const currentDate = new Date();
                const otpExpiry = new Date(currentDate.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours to current time
                const generatedReferralCode = await customer_service_1.default.generateReferralCode(firstName);
                const customerData = {
                    email,
                    firstName,
                    phone,
                    password: await bcrypt_1.default.hash(password, 10),
                    otp: (0, helpers_1.generateOTP)(6),
                    otpExpiry,
                    referralCode: generatedReferralCode,
                    status: '1',
                    failureAttemptsCount: 0,
                    createdAt: new Date()
                };
                const newCustomer = await customer_service_1.default.create(customerData);
                if (newCustomer) {
                    if (referralCodeWithCustomerData) {
                        await customer_wallet_transaction_model_1.default.create({
                            customerId: referralCodeWithCustomerData._id,
                            referrerCustomerId: newCustomer._id,
                            referredCode: referralCode,
                            walletAmount: 0,
                            status: '0'
                        });
                    }
                    return controller.sendSuccessResponse(res, {
                        requestedData: {
                            userId: newCustomer._id,
                            otp: newCustomer.otp,
                            email: newCustomer.email,
                            phone: newCustomer.phone,
                            referralCode
                        },
                        message: 'Customer created successfully!'
                    });
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'This user cant register! Please try again',
                    });
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                });
            }
        }
        catch (error) {
            if (error && error.errors && error.errors.email && error.errors.email.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        email: error.errors.email.properties.message
                    }
                });
            }
            else if (error && error.errors && error.errors.phone && error.errors.phone.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        phone: error.errors.phone.properties.message
                    }
                });
            }
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating customer'
            });
        }
    }
    async forgotPassword(req, res) {
        try {
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('host'));
            if (countryId) {
                const validatedData = authSchema_1.forgotPasswordSchema.safeParse(req.body);
                if (validatedData.success) {
                    const { otpType, email, phone } = validatedData.data;
                    const existingUser = await customer_service_1.default.findOne({
                        ...(otpType === 'email' ? { email } : { phone }),
                        status: '1'
                    });
                    if (existingUser) {
                        const currentDate = new Date();
                        const otpExpiry = new Date(currentDate.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours to current time
                        const updateCustomerOtp = {
                            otp: (0, helpers_1.generateOTP)(6),
                            otpExpiry,
                        };
                        const updatedCustomer = await customer_service_1.default.update(existingUser?.id, updateCustomerOtp);
                        if (updatedCustomer) {
                            return controller.sendSuccessResponse(res, {
                                requestedData: {
                                    otp: updatedCustomer.otp,
                                    email: updatedCustomer.email,
                                    phone: updatedCustomer.phone
                                },
                                message: `Otp successfully sended on ${otpType}`
                            });
                        }
                        else {
                            return controller.sendErrorResponse(res, 200, {
                                message: 'Something wrong on otp generating... please try again!',
                            });
                        }
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: `Invalid ${otpType} or user not found!`,
                        });
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                        validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                    });
                }
            }
            else {
                return controller.sendErrorResponse(res, 500, {
                    message: 'Country is missing'
                });
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating customer'
            });
        }
    }
    async resendOtp(req, res) {
        try {
            const { userId } = req.body;
            const validatedData = authSchema_1.resendOtpSchema.safeParse(req.body);
            if (userId) {
                if (validatedData.success) {
                    const customerData = await customer_service_1.default.findOne({ _id: userId, status: '1' });
                    if (customerData) {
                        const currentDate = new Date();
                        const otpExpiry = new Date(currentDate.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours to current time
                        const optUpdatedCustomer = await customer_service_1.default.update(customerData._id, {
                            otp: (0, helpers_1.generateOTP)(6),
                            otpExpiry,
                        });
                        if (optUpdatedCustomer) {
                            return controller.sendSuccessResponse(res, {
                                requestedData: {
                                    userId: optUpdatedCustomer._id,
                                    otp: optUpdatedCustomer.otp,
                                    email: optUpdatedCustomer.email,
                                    phone: optUpdatedCustomer.phone,
                                },
                                message: 'Otp successfully sent'
                            });
                        }
                        else {
                            return controller.sendErrorResponse(res, 200, {
                                message: 'Something went wrong otp resend!'
                            });
                        }
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Customer not found!'
                        });
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                        validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                    });
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'User id is required'
                });
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating customer'
            });
        }
    }
    async verifyOtp(req, res) {
        try {
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('host'));
            if (countryId) {
                const validatedData = authSchema_1.verifyOtpSchema.safeParse(req.body);
                if (validatedData.success) {
                    const { otpType, otp, email, phone } = validatedData.data;
                    const existingUser = await customer_service_1.default.findOne({
                        ...(otpType === 'email' ? { email } : { phone }),
                        status: '1'
                    });
                    if (existingUser) {
                        const checkValidOtp = await customer_service_1.default.findOne({ _id: existingUser?.id, otp });
                        if (checkValidOtp) {
                            const currentTime = new Date();
                            if (checkValidOtp.otpExpiry && currentTime <= checkValidOtp.otpExpiry) {
                                const updatedCustomer = await customer_service_1.default.update(existingUser?.id, { isVerified: true, failureAttemptsCount: 0 });
                                if (updatedCustomer) {
                                    const checkReferredCode = await customer_wallet_transaction_model_1.default.findOne({
                                        referrerCustomerId: updatedCustomer._id,
                                        status: '0',
                                        referralCode: { $ne: '' }
                                    });
                                    if (checkReferredCode) {
                                        await customer_wallet_transaction_model_1.default.findByIdAndUpdate(checkReferredCode._id, {
                                            walletAmount: 10,
                                            status: '1'
                                        });
                                    }
                                    const token = jsonwebtoken_1.default.sign({
                                        userId: updatedCustomer._id,
                                        email: updatedCustomer.email,
                                        phone: updatedCustomer.phone
                                    }, `${process.env.CUSTOMER_TOKEN_AUTH_KEY}`);
                                    return controller.sendSuccessResponse(res, {
                                        requestedData: {
                                            token,
                                            userId: updatedCustomer._id,
                                            firstName: updatedCustomer.firstName,
                                            email: updatedCustomer.email,
                                            phone: updatedCustomer.phone,
                                            isVerified: updatedCustomer.isVerified,
                                            referralCode: updatedCustomer.referralCode,
                                            status: updatedCustomer.status
                                        },
                                        message: 'Customer otp successfully verified'
                                    });
                                }
                                else {
                                    return controller.sendErrorResponse(res, 200, {
                                        message: 'Something wrong on otp verifying. please try again!',
                                    });
                                }
                            }
                            else {
                                return controller.sendErrorResponse(res, 200, {
                                    message: 'OTP has expired',
                                });
                            }
                        }
                        else {
                            await customer_service_1.default.update(existingUser.id, {
                                failureAttemptsCount: (existingUser.failureAttemptsCount || 0) + 1
                            });
                            return controller.sendErrorResponse(res, 200, {
                                message: 'Invalid otp',
                            });
                        }
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: otpType + ' is not found!',
                        });
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                        validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                    });
                }
            }
            else {
                return controller.sendErrorResponse(res, 500, {
                    message: 'Country is missing'
                });
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating customer'
            });
        }
    }
    async login(req, res) {
        try {
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('host'));
            if (countryId) {
                const validatedData = authSchema_1.loginSchema.safeParse(req.body);
                if (validatedData.success) {
                    const { email, password } = validatedData.data;
                    const user = await customers_model_1.default.findOne({ email: email, status: '1' });
                    if (user) {
                        const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
                        if (isPasswordValid) {
                            const token = jsonwebtoken_1.default.sign({
                                userId: user._id,
                                email: user.email,
                                phone: user.phone
                            }, `${process.env.CUSTOMER_TOKEN_AUTH_KEY}`);
                            return controller.sendSuccessResponse(res, {
                                requestedData: {
                                    token,
                                    userID: user._id,
                                    firstName: user.firstName,
                                    email: user.email,
                                    phone: user.phone,
                                    status: user.status,
                                    isVerified: user.isVerified,
                                    otpType: 'phone'
                                },
                                message: 'Customer login successfully!'
                            });
                        }
                        else {
                            return controller.sendErrorResponse(res, 200, {
                                message: 'Invalid password.',
                            });
                        }
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'User not found',
                        });
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                        validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                    });
                }
            }
            else {
                return controller.sendErrorResponse(res, 500, {
                    message: 'Country is missing'
                });
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating customer'
            });
        }
    }
}
exports.default = new GuestController();

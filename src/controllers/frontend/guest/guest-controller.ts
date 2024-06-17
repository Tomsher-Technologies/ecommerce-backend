
import 'module-alias/register'
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { forgotPasswordSchema, loginSchema, registerSchema, resendOtpSchema, resetPasswordFormSchema, verifyOtpSchema } from '../../../utils/schemas/frontend/guest/authSchema';
import { calculateWalletAmount, formatZodError, generateOTP } from '../../../utils/helpers';
import { blockReferences, websiteSetup } from '../../../constants/website-setup';
import { earnTypes } from '../../../constants/wallet';

import BaseController from '../../../controllers/admin/base-controller';
import CustomerService from '../../../services/frontend/customer-service';
import CustomerModel, { CustomrProps } from '../../../model/frontend/customers-model';
import CommonService from '../../../services/frontend/guest/common-service';
import CustomerWalletTransactionsModel from '../../../model/frontend/customer-wallet-transaction-model'
import SettingsService from '../../../services/admin/setup/settings-service';


const controller = new BaseController();

class GuestController extends BaseController {

    async register(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = registerSchema.safeParse(req.body);

            if (validatedData.success) {
                const { email, firstName, phone, password, referralCode, otpType } = validatedData.data;
                let referralCodeWithCustomerData: any = null;

                if (referralCode) {
                    referralCodeWithCustomerData = await CustomerService.findOne({ referralCode: referralCode, status: '1' }); //referrer
                    if (!referralCodeWithCustomerData) {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Invalid referral code! Please try again',
                        });
                    }
                }

                const currentDate = new Date();
                const otpExpiry = new Date(currentDate.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours to current time
                const generatedReferralCode = await CustomerService.generateReferralCode(firstName);

                const customerData = {
                    email,
                    firstName,
                    phone,
                    password: await bcrypt.hash(password, 10),
                    otp: generateOTP(6),
                    otpExpiry,
                    referralCode: generatedReferralCode,
                    status: '1',
                    failureAttemptsCount: 0,
                    createdAt: new Date()
                };
                const newCustomer = await CustomerService.create(customerData);
                if (newCustomer) {
                    if (referralCodeWithCustomerData) {
                        const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
                        const referAndEarn = await SettingsService.findOne({ countryId, block: websiteSetup.basicSettings, blockReference: blockReferences.referAndEarn });
                        if ((referAndEarn) && (referAndEarn.blockValues) && (referAndEarn.blockValues.enableReferAndEarn) && (Number(referAndEarn.blockValues.maxEarnAmount) > 0 || Number(referAndEarn.blockValues.maxEarnPoints) > 0)) {
                            if ((Number(referAndEarn.blockValues.earnPoints) > 0) && (Number(referAndEarn.blockValues.earnAmount) > 0)) {
                                if (Number(referAndEarn.blockValues.rewardToReferrer) > 0) {
                                    await CustomerWalletTransactionsModel.create({
                                        customerId: referralCodeWithCustomerData._id,
                                        referredCustomerId: newCustomer._id,//referrer
                                        earnType: earnTypes.referrer,
                                        referredCode: referralCode,
                                        walletAmount: calculateWalletAmount(referAndEarn.blockValues.rewardToReferrer, referAndEarn.blockValues),
                                        walletPoints: referAndEarn.blockValues.rewardToReferrer,
                                        status: '0'
                                    });
                                }
                                if (Number(referAndEarn.blockValues.rewardToReferred) > 0) {
                                    await CustomerWalletTransactionsModel.create({
                                        customerId: newCustomer._id,
                                        referrerCustomerId: referralCodeWithCustomerData._id, //rewardToReferred
                                        earnType: earnTypes.referred,
                                        referredCode: referralCode,
                                        walletAmount: calculateWalletAmount(referAndEarn.blockValues.rewardToReferred, referAndEarn.blockValues),
                                        walletPoints: referAndEarn.blockValues.rewardToReferred,
                                        status: '0'
                                    });
                                }
                            }
                        }
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
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'This user cant register! Please try again',
                    });
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                });
            }
        } catch (error: any) {
            if (error && error.errors && error.errors.email && error.errors.email.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        email: error.errors.email.properties.message
                    }
                });
            } else if (error && error.errors && error.errors.phone && error.errors.phone.properties) {
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

    async forgotPassword(req: Request, res: Response): Promise<void> {
        try {
            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                const validatedData = forgotPasswordSchema.safeParse(req.body);
                if (validatedData.success) {
                    const { otpType, email, phone } = validatedData.data;

                    const existingUser = await CustomerService.findOne({
                        ...(otpType === 'email' ? { email } : { phone }),
                        status: '1'
                    });

                    if (existingUser) {
                        const currentDate = new Date();
                        const otpExpiry = new Date(currentDate.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours to current time

                        const updateCustomerOtp = {
                            otp: generateOTP(6),
                            otpExpiry,
                        };
                        const updatedCustomer = await CustomerService.update(existingUser?.id, updateCustomerOtp);
                        if (updatedCustomer) {
                            return controller.sendSuccessResponse(res, {
                                requestedData: {
                                    userId: updatedCustomer._id,
                                    otp: updatedCustomer.otp,
                                    email: updatedCustomer.email,
                                    phone: updatedCustomer.phone,
                                    otpType
                                },
                                message: `Otp successfully sended on ${otpType}`
                            });
                        } else {
                            return controller.sendErrorResponse(res, 200, {
                                message: 'Something wrong on otp generating... please try again!',
                            });
                        }
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: `Invalid ${otpType} or user not found!`,
                        });
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                        validation: formatZodError(validatedData.error.errors)
                    });
                }
            } else {
                return controller.sendErrorResponse(res, 500, {
                    message: 'Country is missing'
                });
            }
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating customer'
            });
        }
    }

    async resetPassword(req: Request, res: Response): Promise<void> {
        try {
            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                const validatedData = resetPasswordFormSchema.safeParse(req.body);
                if (validatedData.success) {
                    const { password, confirmPassword, otp, email } = validatedData.data;

                    const checkValidOtp = await CustomerService.findOne({ email: email, otp });
                    if (checkValidOtp) {
                        const currentTime = new Date();
                        if (checkValidOtp.otpExpiry && currentTime <= checkValidOtp.otpExpiry) {
                            const updatedCustomer = await CustomerService.update(checkValidOtp?.id, {
                                password: await bcrypt.hash(password, 10),
                                failureAttemptsCount: 0,
                                resetPasswordCount: (checkValidOtp.resetPasswordCount + 1)
                            });
                            if (updatedCustomer) {
                                return controller.sendSuccessResponse(res, {
                                    requestedData: {
                                        userId: updatedCustomer._id,
                                        firstName: updatedCustomer.firstName,
                                        email: updatedCustomer.email,
                                        phone: updatedCustomer.phone,
                                        isVerified: updatedCustomer.isVerified,
                                        referralCode: updatedCustomer.referralCode,
                                        status: updatedCustomer.status
                                    },
                                    message: 'Customer password rest successfully. Please realogin with new password'
                                });
                            } else {
                                return controller.sendErrorResponse(res, 200, {
                                    message: 'Something wrong on otp verifying. please try again!',
                                });
                            }
                        } else {
                            return controller.sendErrorResponse(res, 200, {
                                message: 'OTP has expired',
                            });
                        }

                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: email + ' is not found!',
                        });
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                        validation: formatZodError(validatedData.error.errors)
                    });
                }
            } else {
                return controller.sendErrorResponse(res, 500, {
                    message: 'Country is missing'
                });
            }
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating customer'
            });
        }
    }

    async resendOtp(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.body;
            const validatedData = resendOtpSchema.safeParse(req.body);
            if (userId) {
                if (validatedData.success) {
                    const customerData = await CustomerService.findOne({ _id: userId, status: '1' });
                    if (customerData) {
                        const currentDate = new Date();
                        const otpExpiry = new Date(currentDate.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours to current time

                        const optUpdatedCustomer = await CustomerService.update(customerData._id, {
                            otp: generateOTP(6),
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
                        } else {
                            return controller.sendErrorResponse(res, 200, {
                                message: 'Something went wrong otp resend!'
                            });
                        }
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Customer not found!'
                        });
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                        validation: formatZodError(validatedData.error.errors)
                    });
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'User id is required'
                });
            }

        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating customer'
            });
        }
    }

    async verifyOtp(req: Request, res: Response): Promise<void> {
        try {
            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                const validatedData = verifyOtpSchema.safeParse(req.body);
                if (validatedData.success) {
                    const { otpType, otp, email, phone } = validatedData.data;

                    const existingUser = await CustomerService.findOne({
                        ...(otpType === 'email' ? { email } : { phone }),
                        status: '1'
                    });

                    if (existingUser) {
                        const checkValidOtp = await CustomerService.findOne({ _id: existingUser?.id, otp });
                        if (checkValidOtp) {
                            const currentTime = new Date();
                            if (checkValidOtp.otpExpiry && currentTime <= checkValidOtp.otpExpiry) {
                                const updatedCustomer = await CustomerService.update(existingUser?.id, { isVerified: true, failureAttemptsCount: 0 });
                                if (updatedCustomer) {
                                    const checkReferredCode = await CustomerWalletTransactionsModel.findOne({  //referrer
                                        referredCustomerId: updatedCustomer._id,
                                        status: '0',
                                        referralCode: { $ne: '' }
                                    });

                                    if (checkReferredCode) {
                                        const referrerCustomer: any = await CustomerWalletTransactionsModel.findByIdAndUpdate(checkReferredCode._id, {
                                            status: '1'
                                        });
                                        const referredCustomer = await CustomerWalletTransactionsModel.findOne({  //rewardToReferred
                                            referrerCustomerId: checkReferredCode.customerId,
                                            status: '0',
                                            referralCode: { $ne: '' }
                                        });

                                        if (referrerCustomer) {
                                            const referrerCustomerData = await CustomerService.findOne({ _id: referrerCustomer?.customerId });
                                            if (referrerCustomerData) {
                                                await CustomerService.update(referrerCustomerData?._id, { totalRewardPoint: (referrerCustomerData.totalRewardPoint + referrerCustomer.walletPoints), totalWalletAmount: (referrerCustomerData.totalWalletAmount + referrerCustomer.walletAmount) });
                                            }
                                        }

                                        if (referredCustomer) {
                                            await CustomerWalletTransactionsModel.findByIdAndUpdate(referredCustomer._id, {
                                                status: '1'
                                            });
                                            const referredCustomerData = await CustomerService.findOne({ _id: referredCustomer?.customerId });
                                            if (referredCustomerData) {
                                                await CustomerService.update(referredCustomerData?._id, { totalRewardPoint: (referredCustomerData.totalRewardPoint + referredCustomer.walletPoints), totalWalletAmount: (referredCustomerData.totalWalletAmount + referredCustomer.walletAmount) });
                                            }
                                        }
                                    }

                                    const token: string = jwt.sign({
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
                                } else {
                                    return controller.sendErrorResponse(res, 200, {
                                        message: 'Something wrong on otp verifying. please try again!',
                                    });
                                }
                            } else {
                                return controller.sendErrorResponse(res, 200, {
                                    message: 'OTP has expired',
                                });
                            }
                        } else {
                            await CustomerService.update(existingUser.id, {
                                failureAttemptsCount: (existingUser.failureAttemptsCount || 0) + 1
                            });
                            return controller.sendErrorResponse(res, 200, {
                                message: 'Invalid otp',
                            });
                        }
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: otpType + ' is not found!',
                        });
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                        validation: formatZodError(validatedData.error.errors)
                    });
                }
            } else {
                return controller.sendErrorResponse(res, 500, {
                    message: 'Country is missing'
                });
            }
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating customer'
            });
        }
    }

    async login(req: Request, res: Response): Promise<void> {
        try {
            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                const validatedData = loginSchema.safeParse(req.body);
                if (validatedData.success) {
                    const { email, password } = validatedData.data;
                    const user: CustomrProps | null = await CustomerModel.findOne({ email: email, status: '1' });
                    if (user) {
                        const isPasswordValid = await bcrypt.compare(password, user.password);
                        if (isPasswordValid) {
                            const token: string = jwt.sign({
                                userId: user._id,
                                email: user.email,
                                phone: user.phone
                            }, `${process.env.CUSTOMER_TOKEN_AUTH_KEY}`);


                            return controller.sendSuccessResponse(res, {
                                requestedData: {
                                    token,
                                    userId: user._id,
                                    firstName: user.firstName,
                                    email: user.email,
                                    phone: user.phone,
                                    status: user.status,
                                    isVerified: user.isVerified,
                                    otpType: 'phone'
                                },
                                message: 'Customer login successfully!'
                            });
                        } else {
                            return controller.sendErrorResponse(res, 200, {
                                message: 'Invalid password.',
                            });
                        }
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'User not found',
                        });
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                        validation: formatZodError(validatedData.error.errors)
                    });
                }
            } else {
                return controller.sendErrorResponse(res, 500, {
                    message: 'Country is missing'
                });
            }
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating customer'
            });
        }
    }
}

export default new GuestController();

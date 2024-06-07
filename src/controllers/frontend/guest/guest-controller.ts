
import 'module-alias/register'
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { forgotPasswordSchema, loginSchema, registerSchema, verifyOtpSchema } from '../../../utils/schemas/frontend/guest/authSchema';
import { formatZodError, generateOTP } from '../../../utils/helpers';

import BaseController from '../../../controllers/admin/base-controller';
import CustomerService from '../../../services/frontend/customer-service';
import CustomerModel, { CustomrProps } from '../../../model/frontend/customers-model';
import CommonService from '../../../services/frontend/common-service';


const controller = new BaseController();

class GuestController extends BaseController {

    async register(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = registerSchema.safeParse(req.body);

            if (validatedData.success) {
                const { email, firstName, phone, password } = validatedData.data;

                const currentDate = new Date();
                const otpExpiry = new Date(currentDate.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours to current time

                const customerData = {
                    email,
                    firstName,
                    phone,
                    password: await bcrypt.hash(password, 10),
                    otp: generateOTP(6),
                    otpExpiry,
                    status: '1',
                    failureAttemptsCount: 0,
                    createdAt: new Date()
                };
                const newCustomer = await CustomerService.create(customerData);
                if (newCustomer) {
                    controller.sendSuccessResponse(res, {
                        requestedData: {
                            otp: newCustomer.otp,
                            email: newCustomer.email,
                            phone: newCustomer.phone
                        },
                        message: 'Customer created successfully!'
                    });
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'This user cant register! Please try again',
                    });
                }
            } else {
                controller.sendErrorResponse(res, 200, {
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
            controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating customer'
            });
        }
    }

    async forgotPassword(req: Request, res: Response): Promise<void> {
        try {
            const countryId = await CommonService.findOneCountryShortTitleWithId(req.get('host'));
            if (countryId) {
                const validatedData = forgotPasswordSchema.safeParse(req.body);
                if (validatedData.success) {
                    const { otpType, email, phone } = validatedData.data;

                    const existingUser = await CustomerService.findOne({
                        ...(otpType === 'email' ? { email } : { phone })
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
                            controller.sendSuccessResponse(res, {
                                requestedData: {
                                    otp: updatedCustomer.otp,
                                    email: updatedCustomer.email,
                                    phone: updatedCustomer.phone
                                },
                                message:`Otp successfully sended on ${otpType}`
                            });
                        } else {
                            controller.sendErrorResponse(res, 200, {
                                message: 'Something wrong on otp generating... please try again!',
                            });
                        }
                    } else {
                        controller.sendErrorResponse(res, 200, {
                            message: `Invalid ${otpType} or user not found!`,
                        });
                    }
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                        validation: formatZodError(validatedData.error.errors)
                    });
                }
            } else {
                controller.sendErrorResponse(res, 500, {
                    message: 'Country is missing'
                });
            }
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating customer'
            });
        }
    }

    async verifyOtp(req: Request, res: Response): Promise<void> {
        try {
            const countryId = await CommonService.findOneCountryShortTitleWithId(req.get('host'));
            if (countryId) {
                const validatedData = verifyOtpSchema.safeParse(req.body);
                if (validatedData.success) {
                    const { otpType, otp, email, phone } = validatedData.data;

                    const existingUser = await CustomerService.findOne({
                        ...(otpType === 'email' ? { email } : { phone })
                    });

                    if (existingUser) {
                        const checkValidOtp = await CustomerService.findOne({ _id: existingUser?.id, otp });
                        if (checkValidOtp) {
                            const currentTime = new Date();
                            if (checkValidOtp.otpExpiry && currentTime <= checkValidOtp.otpExpiry) {
                                const updatedCustomer = await CustomerService.update(existingUser?.id, { isVerified: true, failureAttemptsCount: 0 });
                                if (updatedCustomer) {
                                    const token: string = jwt.sign({
                                        userId: updatedCustomer._id,
                                        email: updatedCustomer.email,
                                        phone: updatedCustomer.phone
                                    }, `${process.env.CUSTOMER_TOKEN_AUTH_KEY}`);

                                    controller.sendSuccessResponse(res, {
                                        requestedData: {
                                            token,
                                            userId: updatedCustomer._id,
                                            firstName: updatedCustomer.firstName,
                                            email: updatedCustomer.email,
                                            phone: updatedCustomer.phone,
                                            isVerified: updatedCustomer.isVerified,
                                            activeStatus: updatedCustomer.activeStatus
                                        },
                                        message: 'Customer otp successfully verified'
                                    });
                                } else {
                                    controller.sendErrorResponse(res, 200, {
                                        message: 'Something wrong on otp verifying. please try again!',
                                    });
                                }
                            } else {
                                controller.sendErrorResponse(res, 200, {
                                    message: 'OTP has expired',
                                });
                            }
                        } else {
                            await CustomerService.update(existingUser.id, {
                                failureAttemptsCount: (existingUser.failureAttemptsCount || 0) + 1
                            });
                            controller.sendErrorResponse(res, 200, {
                                message: 'Invalid otp',
                            });
                        }
                    } else {
                        controller.sendErrorResponse(res, 200, {
                            message: otpType + ' is not found!',
                        });
                    }
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                        validation: formatZodError(validatedData.error.errors)
                    });
                }
            } else {
                controller.sendErrorResponse(res, 500, {
                    message: 'Country is missing'
                });
            }
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating customer'
            });
        }
    }

    async login(req: Request, res: Response): Promise<void> {
        try {
            const countryId = await CommonService.findOneCountryShortTitleWithId(req.get('host'));
            if (countryId) {
                const validatedData = loginSchema.safeParse(req.body);
                if (validatedData.success) {
                    const { email, password } = validatedData.data;
                    const user: CustomrProps | null = await CustomerModel.findOne({ email: email });
                    if (user) {
                        const isPasswordValid = await bcrypt.compare(password, user.password);
                        if (isPasswordValid) {
                            const token: string = jwt.sign({
                                userId: user._id,
                                email: user.email,
                                phone: user.phone
                            }, `${process.env.CUSTOMER_TOKEN_AUTH_KEY}`);

                            controller.sendSuccessResponse(res, {
                                requestedData: {
                                    token,
                                    userID: user._id,
                                    firstName: user.firstName,
                                    email: user.email,
                                    phone: user.phone,
                                    activeStatus: user.activeStatus
                                },
                                message: 'Customer created successfully!'
                            });
                        } else {
                            controller.sendErrorResponse(res, 200, {
                                message: 'Invalid password.',
                            });
                        }
                    } else {
                        controller.sendErrorResponse(res, 200, {
                            message: 'User not found',
                        });
                    }
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                        validation: formatZodError(validatedData.error.errors)
                    });
                }
            } else {
                controller.sendErrorResponse(res, 500, {
                    message: 'Country is missing'
                });
            }
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating customer'
            });
        }
    }
}

export default new GuestController();

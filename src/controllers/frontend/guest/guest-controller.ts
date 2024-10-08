
import 'module-alias/register'
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import path from 'path';
const ejs = require('ejs');
const { convert } = require('html-to-text');

import { forgotPasswordSchema, guestRegisterSchema, loginSchema, registerSchema, resendOtpSchema, resetPasswordFormSchema, verifyOtpSchema } from '../../../utils/schemas/frontend/guest/auth-schema';
import { calculateWalletAmount, formatZodError, generateOTP } from '../../../utils/helpers';
import { blockReferences, websiteSetup } from '../../../constants/website-setup';
import { earnTypes } from '../../../constants/wallet';
import { guestRegisterOtp, registerOtp, resendOtp, resetPasswordOtp, subjects } from '../../../constants/messages';

import { smtpEmailGateway } from '../../../lib/emails/smtp-nodemailer-gateway';
import { bulkSmsGateway } from '../../../lib/sms/bulk-sms-gateway';

import BaseController from '../../../controllers/admin/base-controller';
import CustomerService from '../../../services/frontend/customer-service';
import CustomerModel, { CustomrProps } from '../../../model/frontend/customers-model';
import CommonService from '../../../services/frontend/guest/common-service';
import CustomerWalletTransactionsModel from '../../../model/frontend/customer-wallet-transaction-model'
import SettingsService from '../../../services/admin/setup/settings-service';
import { mailChimpEmailGateway } from '../../../lib/emails/mail-chimp-sms-gateway';
import WebsiteSetupModel from '../../../model/admin/setup/website-setup-model';
import CartOrdersModel from '../../../model/frontend/cart-order-model';
import CartOrderProductsModel from '../../../model/frontend/cart-order-product-model';


const controller = new BaseController();

const options = {
    wordwrap: 130,
};
class GuestController extends BaseController {

    async register(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = registerSchema.safeParse(req.body);
            if (validatedData.success) {
                const { email, firstName, phone, password, referralCode, otpType } = validatedData.data;
                let existCustomer: any = await CustomerModel.findOne({
                    $and: [
                        { $or: [{ email }, { phone }] },
                        {
                            isGuest: true
                        }
                    ]
                });
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
                if (!existCustomer) {
                    const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
                    const customerData = {
                        countryId,
                        email,
                        firstName,
                        phone,
                        password: await bcrypt.hash(password, 10),
                        otp: generateOTP(4),
                        otpExpiry,
                        referralCode: generatedReferralCode,
                        status: '1',
                        failureAttemptsCount: 0,
                        createdAt: new Date()
                    };
                    existCustomer = await CustomerService.create(customerData);
                    if (referralCodeWithCustomerData) {
                        const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
                        const referAndEarn = await SettingsService.findOne({ countryId, block: websiteSetup.basicSettings, blockReference: blockReferences.referAndEarn });
                        if ((referAndEarn) && (referAndEarn.blockValues) && (referAndEarn.blockValues.enableReferAndEarn) && (Number(referAndEarn.blockValues.maxEarnAmount) > 0 || Number(referAndEarn.blockValues.maxEarnPoints) > 0)) {
                            if ((Number(referAndEarn.blockValues.earnPoints) > 0) && (Number(referAndEarn.blockValues.earnAmount) > 0)) {
                                if (Number(referAndEarn.blockValues.rewardToReferrer) > 0) {
                                    await CustomerWalletTransactionsModel.create({
                                        customerId: referralCodeWithCustomerData._id,
                                        referredCustomerId: existCustomer._id,//referrer
                                        earnType: earnTypes.referrer,
                                        referredCode: referralCode,
                                        walletAmount: calculateWalletAmount(referAndEarn.blockValues.rewardToReferrer, referAndEarn.blockValues),
                                        walletPoints: referAndEarn.blockValues.rewardToReferrer,
                                        status: '0'
                                    });
                                }
                                if (Number(referAndEarn.blockValues.rewardToReferred) > 0) {
                                    await CustomerWalletTransactionsModel.create({
                                        customerId: existCustomer._id,
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
                    // const etisalatDefaultValues = smsGatwayDefaultValues('username', 'password', 'TIME HOUSE TRADING LLC ', existCustomer)

                    // const sendOtp = await etisalatSmsGateway({
                    //     "sender": "TIME HOUSE TRADING LLC",
                    //     "recipient": '+971556151476',
                    //     "message": "Hello from Etisalat SMS Gateway!"
                    // })
                    // console.log("sendOtp", sendOtp);

                    let websiteSettingsQuery: any = { _id: { $exists: true } };
                    websiteSettingsQuery = {
                        ...websiteSettingsQuery,
                        countryId: existCustomer.countryId,
                        block: websiteSetup.basicSettings,
                        blockReference: { $in: [blockReferences.defualtSettings, blockReferences.basicDetailsSettings, blockReferences.socialMedia, blockReferences.appUrls] },
                        status: '1',
                    } as any;

                    const settingsDetails = await WebsiteSetupModel.find(websiteSettingsQuery);
                    if (settingsDetails) {
                        const basicDetailsSettings = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.basicDetailsSettings)?.blockValues;
                        const socialMedia = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.socialMedia)?.blockValues;
                        const appUrls = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.appUrls)?.blockValues;
                        const emailTemplate = ejs.renderFile(path.join(__dirname, '../../../views/email', 'email-otp.ejs'),
                            {
                                otp: existCustomer.otp,
                                firstName: existCustomer.firstName,
                                storeEmail: basicDetailsSettings?.storeEmail,
                                storePhone: basicDetailsSettings?.storePhone,
                                shopDescription: convert(basicDetailsSettings?.shopDescription, options),
                                socialMedia,
                                appUrls,
                                subject: subjects.verificationOTP,
                                shopLogo: `${process.env.SHOPLOGO}`,
                                shopName: `${process.env.SHOPNAME}`,
                                appUrl: `${process.env.APPURL}`
                            },
                            async (err: any, template: any) => {
                                if (err) {
                                    console.log(err);
                                    return;
                                }
                                if (process.env.SHOPNAME === 'Timehouse') {
                                    const sendEmail = await mailChimpEmailGateway({ ...existCustomer.toObject(), subject: subjects.verificationOTP }, template)
                                } else if (process.env.SHOPNAME === 'Homestyle') {
                                    const sendEmail = await smtpEmailGateway({ ...existCustomer.toObject(), subject: subjects.verificationOTP }, template)
                                    const sendsms = await bulkSmsGateway({ ...existCustomer.toObject(), message: registerOtp(process.env.SHOPNAME, Number(existCustomer.otp)) })
                                } else if (process.env.SHOPNAME === 'Beyondfresh') {
                                    const sendEmail = await smtpEmailGateway({ ...existCustomer.toObject(), subject: subjects.verificationOTP }, template)
                                } else if (process.env.SHOPNAME === 'Smartbaby') {
                                    const sendEmail = await smtpEmailGateway({ ...existCustomer.toObject(), subject: subjects.verificationOTP }, template)
                                    const sendsms = await bulkSmsGateway({ ...existCustomer.toObject(), message: registerOtp(process.env.SHOPNAME, Number(existCustomer.otp)) })
                                }
                            })
                    }
                } else {
                    await CustomerModel.findOneAndUpdate(existCustomer._id, {
                        isGuest: false,
                        email,
                        firstName,
                        phone,
                        password: await bcrypt.hash(password, 10),
                        otp: generateOTP(4),
                        otpExpiry,
                        referralCode: generatedReferralCode,
                        status: '1',
                        failureAttemptsCount: 0,
                        createdAt: new Date()
                    })
                }

                if (existCustomer) {
                    const payload: any = {
                        userId: existCustomer._id,
                        email: existCustomer.email,
                        phone: existCustomer.phone,
                        firstName: existCustomer.firstName,
                        ...(existCustomer.isGuest ? {} : { totalWalletAmount: existCustomer.totalWalletAmount })
                    };
                    const token: string = jwt.sign(payload, `${process.env.TOKEN_SECRET_KEY}`, { expiresIn: '10y' });
                    return controller.sendSuccessResponse(res, {
                        requestedData: {
                            userId: existCustomer._id,
                            firstName: existCustomer.firstName,
                            // otp: existCustomer.otp,
                            email: existCustomer.email,
                            phone: existCustomer.phone,
                            isVerified: existCustomer.isVerified,
                            isGuest: existCustomer.isGuest,
                            ...(!existCustomer.isVerified ? {} : { referralCode: existCustomer.referralCode, token }),

                        },
                        message: 'Customer created successfully!.'
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

    async guestRegister(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = guestRegisterSchema.safeParse(req.body);
            if (validatedData.success) {
                const { email, phone, notRequiredOtp, otpType } = validatedData.data;
                const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
                const currentDate = new Date();
                const otpExpiry = new Date(currentDate.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours to current time

                let newCustomer: any = await CustomerModel.findOne({
                    $and: [
                        { $or: [{ email }, { phone }] }
                    ]
                }).lean();
                const uuid = req.header('User-Token');
                if (!newCustomer) {
                    const customerData = {
                        guestUserId: uuid,
                        countryId,
                        firstName: "Guest",
                        email,
                        phone,
                        otp: generateOTP(4),
                        otpExpiry,
                        isGuest: true,
                        status: '1',
                        failureAttemptsCount: 0,
                        guestRegisterCount: 1,
                        createdAt: new Date()
                    };
                    newCustomer = await CustomerService.create(customerData);
                } else {
                    newCustomer = await CustomerService.update(newCustomer._id, {
                        guestUserId: uuid,
                        guestRegisterCount: ((newCustomer?.guestRegisterCount > 0 ? newCustomer.guestRegisterCount + 1 : 1) || 1),
                        isGuest: true,
                        otp: generateOTP(4),
                        otpExpiry,
                        failureAttemptsCount: 0,
                        guestPhone: phone,
                        email: email,
                    });
                    newCustomer = {
                        ...newCustomer.toObject(),
                        phone: phone,
                        email: email,
                    }
                }

                if (newCustomer) {
                    let token: string = '';
                    if (!notRequiredOtp) {
                        let websiteSettingsQuery: any = { _id: { $exists: true } };
                        websiteSettingsQuery = {
                            ...websiteSettingsQuery,
                            countryId: newCustomer.countryId,
                            block: websiteSetup.basicSettings,
                            blockReference: { $in: [blockReferences.defualtSettings, blockReferences.basicDetailsSettings, blockReferences.socialMedia, blockReferences.appUrls] },
                            status: '1',
                        } as any;

                        const settingsDetails = await WebsiteSetupModel.find(websiteSettingsQuery);
                        if (settingsDetails) {
                            const basicDetailsSettings = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.basicDetailsSettings)?.blockValues;
                            const socialMedia = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.socialMedia)?.blockValues;
                            const appUrls = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.appUrls)?.blockValues;
                            const emailTemplate = ejs.renderFile(path.join(__dirname, '../../../views/email', 'email-otp.ejs'),
                                {
                                    otp: newCustomer.otp,
                                    firstName: newCustomer.firstName,
                                    storeEmail: basicDetailsSettings?.storeEmail,
                                    storePhone: basicDetailsSettings?.storePhone,
                                    shopDescription: convert(basicDetailsSettings?.shopDescription, options),
                                    socialMedia,
                                    appUrls,
                                    subject: subjects.verificationOTP,
                                    shopLogo: `${process.env.SHOPLOGO}`,
                                    shopName: `${process.env.SHOPNAME}`,
                                    appUrl: `${process.env.APPURL}`
                                },
                                async (err: any, template: any) => {
                                    if (err) {
                                        console.log("email eroor", err);
                                        return;
                                    }
                                    if (process.env.SHOPNAME === 'Timehouse') {
                                        const sendEmail = await mailChimpEmailGateway({ ...newCustomer, subject: subjects.verificationOTP }, template)
                                    } else if (process.env.SHOPNAME === 'Homestyle') {
                                        const sendEmail = await smtpEmailGateway({ ...newCustomer, subject: subjects.verificationOTP }, template)
                                        const sendsms = await bulkSmsGateway({ ...newCustomer, message: guestRegisterOtp(process.env.SHOPNAME, newCustomer.otp) })
                                    } else if (process.env.SHOPNAME === 'Beyondfresh') {
                                        const sendEmail = await smtpEmailGateway({ ...newCustomer, subject: subjects.verificationOTP }, template)
                                    } else if (process.env.SHOPNAME === 'Smartbaby') {
                                        const sendEmail = await smtpEmailGateway({ ...newCustomer, subject: subjects.verificationOTP }, template)
                                        const sendsms = await bulkSmsGateway({ ...newCustomer, message: guestRegisterOtp(process.env.SHOPNAME, newCustomer.otp) })
                                    }
                                })
                        }
                    } else {
                        if (newCustomer?.isGuest) {
                            const existingCart = await CartOrdersModel.findOne({ customerId: newCustomer._id, cartStatus: '1' });
                            if (existingCart) {
                                await CartOrdersModel.findOneAndDelete({ _id: existingCart._id });
                                await CartOrderProductsModel.deleteMany({ cartId: existingCart._id });
                            }

                            const uuid = req.header('User-Token');
                            const guestUserCart = await CartOrdersModel.findOneAndUpdate(
                                { guestUserId: uuid, cartStatus: '1' },
                                { $set: { customerId: newCustomer._id, isGuest: true, guestUserId: null } },
                                { new: true }
                            );
                        }
                        const payload: any = {
                            userId: newCustomer._id,
                            email: newCustomer.email,
                            phone: newCustomer.phone,
                            firstName: newCustomer.firstName,
                            ...(newCustomer.isGuest ? {} : { totalWalletAmount: newCustomer.totalWalletAmount })
                        };
                        const expiresIn = newCustomer.isGuest ? '1h' : '10y';
                        token = jwt.sign(payload, `${process.env.TOKEN_SECRET_KEY}`, { expiresIn });
                    }

                    return controller.sendSuccessResponse(res, {
                        requestedData: {
                            token,
                            userId: newCustomer._id,
                            email: newCustomer.email,
                            phone: newCustomer.phone,
                            isVerified: newCustomer.isVerified,
                            isGuest: newCustomer.isGuest,
                            guestRegisterCount: newCustomer.guestRegisterCount,
                            ...(notRequiredOtp ? { lastLoggedAt: new Date() } : {}),
                        },
                        message: notRequiredOtp ? "Customer login successfully!" : 'Customer created successfully! An OTP has been sent to your email for verification.'
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

    async login(req: Request, res: Response): Promise<void> {
        try {
            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                const validatedData = loginSchema.safeParse(req.body);
                if (validatedData.success) {
                    const { email, password } = validatedData.data;
                    const user: CustomrProps | null = await CustomerModel.findOne({ email: email, status: '1' });
                    if (user && user.password !== '') {
                        const isPasswordValid = user.password ? await bcrypt.compare(password, user.password) : false;
                        if (isPasswordValid) {
                            const updateData: Partial<any> = {
                                lastLoggedAt: new Date()
                            };
                            if (user?.isGuest) {
                                updateData.isGuest = false;
                            }
                            await CustomerService.update(user._id, updateData);

                            const token: string = jwt.sign({
                                userId: user._id,
                                email: user.email,
                                phone: user.phone,
                                firstName: user.firstName,
                                totalWalletAmount: user.totalWalletAmount,
                            }, `${process.env.TOKEN_SECRET_KEY}`);

                            if (!user.isVerified) {
                                let websiteSettingsQuery: any = { _id: { $exists: true } };
                                websiteSettingsQuery = {
                                    ...websiteSettingsQuery,
                                    countryId: user.countryId,
                                    block: websiteSetup.basicSettings,
                                    blockReference: { $in: [blockReferences.defualtSettings, blockReferences.basicDetailsSettings, blockReferences.socialMedia, blockReferences.appUrls] },
                                    status: '1',
                                } as any;

                                const settingsDetails = await WebsiteSetupModel.find(websiteSettingsQuery);
                                if (settingsDetails) {
                                    const basicDetailsSettings = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.basicDetailsSettings)?.blockValues;
                                    const socialMedia = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.socialMedia)?.blockValues;
                                    const appUrls = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.appUrls)?.blockValues;
                                    const emailTemplate = ejs.renderFile(path.join(__dirname, '../../../views/email', 'email-otp.ejs'),
                                        {
                                            otp: user.otp,
                                            firstName: user.firstName,
                                            storeEmail: basicDetailsSettings?.storeEmail,
                                            storePhone: basicDetailsSettings?.storePhone,
                                            shopDescription: convert(basicDetailsSettings?.shopDescription, options),
                                            socialMedia,
                                            appUrls,
                                            subject: subjects.verificationOTP,
                                            shopLogo: `${process.env.SHOPLOGO}`,
                                            shopName: `${process.env.SHOPNAME}`,
                                            appUrl: `${process.env.APPURL}`
                                        },
                                        async (err: any, template: any) => {
                                            if (err) {
                                                console.log(err);
                                                return;
                                            }
                                            if (process.env.SHOPNAME === 'Timehouse') {
                                                const sendEmail = await mailChimpEmailGateway({ ...user.toObject(), subject: subjects.verificationOTP }, template)
                                            } else if (process.env.SHOPNAME === 'Homestyle') {
                                                const sendEmail = await smtpEmailGateway({ ...user.toObject(), subject: subjects.verificationOTP }, template)
                                                const sendsms = await bulkSmsGateway({ ...user.toObject(), message: resendOtp(Number(user.otp)) })
                                            } else if (process.env.SHOPNAME === 'Beyondfresh') {
                                                const sendEmail = await smtpEmailGateway({ ...user.toObject(), subject: subjects.verificationOTP }, template)
                                            } else if (process.env.SHOPNAME === 'Smartbaby') {
                                                const sendEmail = await smtpEmailGateway({ ...user.toObject(), subject: subjects.verificationOTP }, template)
                                                const sendsms = await bulkSmsGateway({ ...user.toObject(), message: resendOtp(Number(user.otp)) })
                                            }
                                        })
                                }
                            }
                            return controller.sendSuccessResponse(res, {
                                requestedData: {
                                    token,
                                    userId: user._id,
                                    firstName: user.firstName,
                                    email: user.email,
                                    phone: user.phone,
                                    status: user.status,
                                    isVerified: user.isVerified,
                                    referralCode: user.referralCode,
                                    lastLoggedAt: user?.lastLoggedAt || new Date(),
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
                            otp: generateOTP(4),
                            otpExpiry,
                        };
                        const updatedCustomer = await CustomerService.update(existingUser?.id, updateCustomerOtp);
                        if (updatedCustomer) {

                            let websiteSettingsQuery: any = { _id: { $exists: true } };
                            websiteSettingsQuery = {
                                ...websiteSettingsQuery,
                                countryId: updatedCustomer.countryId,
                                block: websiteSetup.basicSettings,
                                blockReference: { $in: [blockReferences.basicDetailsSettings, blockReferences.socialMedia, blockReferences.appUrls] },
                                status: '1',
                            } as any;

                            const settingsDetails = await WebsiteSetupModel.find(websiteSettingsQuery);
                            if (settingsDetails) {
                                const basicDetailsSettings = await settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.basicDetailsSettings)?.blockValues;
                                const socialMedia = await settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.socialMedia)?.blockValues;
                                const appUrls = await settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.appUrls)?.blockValues;

                                const emailTemplate = ejs.renderFile(path.join(__dirname, '../../../views/email', 'email-otp.ejs'),
                                    {
                                        otp: updatedCustomer.otp,
                                        firstName: updatedCustomer.firstName,
                                        storeEmail: basicDetailsSettings?.storeEmail,
                                        storePhone: basicDetailsSettings?.storePhone,
                                        shopDescription: convert(basicDetailsSettings?.shopDescription, options),
                                        socialMedia,
                                        appUrls,
                                        subject: subjects.passwordResetConfirmation,
                                        shopLogo: `${process.env.SHOPLOGO}`,
                                        shopName: `${process.env.SHOPNAME}`,
                                        appUrl: `${process.env.APPURL}`
                                    }, async (err: any, template: any) => {
                                        if (err) {
                                            console.log(err);
                                            return;
                                        }
                                        if (process.env.SHOPNAME === 'Timehouse') {
                                            const sendEmail = await mailChimpEmailGateway({ email: updatedCustomer.email, subject: subjects.passwordResetConfirmation }, template)

                                        } else if (process.env.SHOPNAME === 'Homestyle') {
                                            const sendEmail = await smtpEmailGateway({ email: updatedCustomer.email, subject: subjects.passwordResetConfirmation }, template)
                                            const sendsms = await bulkSmsGateway({ ...updatedCustomer.toObject(), message: resetPasswordOtp(Number(updatedCustomer.otp)) })
                                        }
                                        else if (process.env.SHOPNAME === 'Beyondfresh') {
                                            const sendEmail = await smtpEmailGateway({ email: updatedCustomer.email, subject: subjects.passwordResetConfirmation }, template)
                                        }
                                        else if (process.env.SHOPNAME === 'Smartbaby') {
                                            const sendEmail = await smtpEmailGateway({ email: updatedCustomer.email, subject: subjects.passwordResetConfirmation }, template)
                                            const sendsms = await bulkSmsGateway({ ...updatedCustomer.toObject(), message: resetPasswordOtp(Number(updatedCustomer.otp)) })
                                        }
                                    })
                            }

                            return controller.sendSuccessResponse(res, {
                                requestedData: {
                                    userId: updatedCustomer._id,
                                    otp: updatedCustomer.otp,
                                    email: updatedCustomer.email,
                                    phone: updatedCustomer.phone,
                                    otpType
                                },
                                message: `OTP successfully sent to ${otpType}`
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
                                    message: 'Your password has been reset successfully. Please log in using your new password.'
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
                            message: 'Invalid OTP!',
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
                            otp: generateOTP(4),
                            otpExpiry,
                        });
                        if (optUpdatedCustomer) {
                            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));

                            let websiteSettingsQuery: any = { _id: { $exists: true } };
                            websiteSettingsQuery = {
                                ...websiteSettingsQuery,
                                countryId: optUpdatedCustomer.countryId,
                                block: websiteSetup.basicSettings,
                                blockReference: { $in: [blockReferences.defualtSettings, blockReferences.basicDetailsSettings, blockReferences.socialMedia, blockReferences.appUrls] },
                                status: '1',
                            } as any;

                            const settingsDetails = await WebsiteSetupModel.find(websiteSettingsQuery);
                            if (settingsDetails) {
                                const basicDetailsSettings = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.basicDetailsSettings)?.blockValues;
                                const socialMedia = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.socialMedia)?.blockValues;
                                const appUrls = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.appUrls)?.blockValues;
                                const emailTemplate = ejs.renderFile(path.join(__dirname, '../../../views/email', 'email-otp.ejs'),
                                    {
                                        otp: optUpdatedCustomer.otp,
                                        firstName: optUpdatedCustomer.firstName,
                                        storeEmail: basicDetailsSettings?.storeEmail,
                                        storePhone: basicDetailsSettings?.storePhone,
                                        shopDescription: convert(basicDetailsSettings?.shopDescription, options),
                                        socialMedia,
                                        appUrls,
                                        subject: subjects.resentVerificationOTP,
                                        shopLogo: `${process.env.SHOPLOGO}`,
                                        shopName: `${process.env.SHOPNAME}`,
                                        appUrl: `${process.env.APPURL}`
                                    },
                                    async (err: any, template: any) => {
                                        if (err) {
                                            console.log(err);
                                            return;
                                        }
                                        if (process.env.SHOPNAME === 'Timehouse') {
                                            const sendEmail = await mailChimpEmailGateway({ email: optUpdatedCustomer.email, subject: subjects.resentVerificationOTP }, template)

                                        } else if (process.env.SHOPNAME === 'Homestyle') {
                                            const sendEmail = await smtpEmailGateway({ email: optUpdatedCustomer.email, subject: subjects.resentVerificationOTP }, template)
                                            const sendsms = await bulkSmsGateway({ ...optUpdatedCustomer.toObject(), message: resendOtp(Number(optUpdatedCustomer.otp)) })
                                        }
                                        else if (process.env.SHOPNAME === 'Beyondfresh') {
                                            const sendEmail = await smtpEmailGateway({ email: optUpdatedCustomer.email, subject: subjects.resentVerificationOTP }, template)
                                        }
                                        else if (process.env.SHOPNAME === 'Smartbaby') {
                                            const sendEmail = await smtpEmailGateway({ email: optUpdatedCustomer.email, subject: subjects.resentVerificationOTP }, template)
                                            const sendsms = await bulkSmsGateway({ ...optUpdatedCustomer.toObject(), message: resendOtp(Number(optUpdatedCustomer.otp)) })
                                        }
                                    });
                            }


                            return controller.sendSuccessResponse(res, {
                                requestedData: {
                                    userId: optUpdatedCustomer._id,
                                    otp: optUpdatedCustomer.otp,
                                    email: optUpdatedCustomer.email,
                                    phone: optUpdatedCustomer.phone,
                                },
                                message: 'OTP successfully sent'
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
                                    if (!updatedCustomer?.isGuest) {
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
                                    }

                                    const payload: any = {
                                        userId: updatedCustomer._id,
                                        email: updatedCustomer.email,
                                        phone: updatedCustomer.phone,
                                        firstName: updatedCustomer.firstName,
                                        ...(updatedCustomer.isGuest ? {} : { totalWalletAmount: updatedCustomer.totalWalletAmount })
                                    };
                                    const expiresIn = updatedCustomer.isGuest ? '1h' : '10y';
                                    const token: string = jwt.sign(payload, `${process.env.TOKEN_SECRET_KEY}`, { expiresIn });

                                    await CustomerService.update(updatedCustomer._id, {
                                        lastLoggedAt: new Date()
                                    });
                                    const uuid = req.header('User-Token');
                                    if (updatedCustomer?.isGuest) {
                                        const existingCart = await CartOrdersModel.findOne({ customerId: updatedCustomer._id, cartStatus: '1' });
                                        if (existingCart) {
                                            await CartOrdersModel.findOneAndDelete({ _id: existingCart._id });
                                            await CartOrderProductsModel.deleteMany({ cartId: existingCart._id });
                                        }
                                    }
                                    const guestUserCart = await CartOrdersModel.findOneAndUpdate(
                                        { guestUserId: uuid, cartStatus: '1' },
                                        { $set: { customerId: updatedCustomer._id, isGuest: true, guestUserId: null } },
                                        { new: true }
                                    );
                                    return controller.sendSuccessResponse(res, {
                                        requestedData: {
                                            token,
                                            userId: updatedCustomer._id,
                                            firstName: updatedCustomer.firstName,
                                            email: updatedCustomer.email,
                                            phone: updatedCustomer.phone,
                                            isVerified: updatedCustomer.isVerified,
                                            isGuest: updatedCustomer.isGuest,
                                            lastLoggedAt: updatedCustomer?.lastLoggedAt || new Date(),
                                            ...(updatedCustomer.isGuest ? {} : { referralCode: updatedCustomer.referralCode }),
                                            status: updatedCustomer.status
                                        },
                                        message: 'Customer OTP successfully verified.'
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


}

export default new GuestController();

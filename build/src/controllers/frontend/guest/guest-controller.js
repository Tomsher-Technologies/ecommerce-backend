"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const path_1 = __importDefault(require("path"));
const ejs = require('ejs');
const { convert } = require('html-to-text');
const auth_schema_1 = require("../../../utils/schemas/frontend/guest/auth-schema");
const helpers_1 = require("../../../utils/helpers");
const website_setup_1 = require("../../../constants/website-setup");
const wallet_1 = require("../../../constants/wallet");
const messages_1 = require("../../../constants/messages");
const smtp_nodemailer_gateway_1 = require("../../../lib/emails/smtp-nodemailer-gateway");
const bulk_sms_gateway_1 = require("../../../lib/sms/bulk-sms-gateway");
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const customer_service_1 = __importDefault(require("../../../services/frontend/customer-service"));
const customers_model_1 = __importDefault(require("../../../model/frontend/customers-model"));
const common_service_1 = __importDefault(require("../../../services/frontend/guest/common-service"));
const customer_wallet_transaction_model_1 = __importDefault(require("../../../model/frontend/customer-wallet-transaction-model"));
const settings_service_1 = __importDefault(require("../../../services/admin/setup/settings-service"));
const mail_chimp_sms_gateway_1 = require("../../../lib/emails/mail-chimp-sms-gateway");
const website_setup_model_1 = __importDefault(require("../../../model/admin/setup/website-setup-model"));
const cart_order_model_1 = __importDefault(require("../../../model/frontend/cart-order-model"));
const cart_order_product_model_1 = __importDefault(require("../../../model/frontend/cart-order-product-model"));
const controller = new base_controller_1.default();
const options = {
    wordwrap: 130,
};
class GuestController extends base_controller_1.default {
    async register(req, res) {
        try {
            const validatedData = auth_schema_1.registerSchema.safeParse(req.body);
            if (validatedData.success) {
                const { email, firstName, phone, password, referralCode, otpType } = validatedData.data;
                let existCustomer = await customers_model_1.default.findOne({
                    $and: [
                        { $or: [{ email }, { phone }] },
                        {
                            isGuest: true
                        }
                    ]
                });
                let referralCodeWithCustomerData = null;
                if (referralCode) {
                    referralCodeWithCustomerData = await customer_service_1.default.findOne({ referralCode: referralCode, status: '1' }); //referrer
                    if (!referralCodeWithCustomerData) {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Invalid referral code! Please try again',
                        });
                    }
                }
                const currentDate = new Date();
                const otpExpiry = new Date(currentDate.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours to current time
                const generatedReferralCode = await customer_service_1.default.generateReferralCode(firstName);
                if (!existCustomer) {
                    const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
                    const customerData = {
                        countryId,
                        email,
                        firstName,
                        phone,
                        password: await bcrypt_1.default.hash(password, 10),
                        otp: (0, helpers_1.generateOTP)(4),
                        otpExpiry,
                        referralCode: generatedReferralCode,
                        status: '1',
                        failureAttemptsCount: 0,
                        createdAt: new Date()
                    };
                    existCustomer = await customer_service_1.default.create(customerData);
                    if (referralCodeWithCustomerData) {
                        const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
                        const referAndEarn = await settings_service_1.default.findOne({ countryId, block: website_setup_1.websiteSetup.basicSettings, blockReference: website_setup_1.blockReferences.referAndEarn });
                        if ((referAndEarn) && (referAndEarn.blockValues) && (referAndEarn.blockValues.enableReferAndEarn) && (Number(referAndEarn.blockValues.maxEarnAmount) > 0 || Number(referAndEarn.blockValues.maxEarnPoints) > 0)) {
                            if ((Number(referAndEarn.blockValues.earnPoints) > 0) && (Number(referAndEarn.blockValues.earnAmount) > 0)) {
                                if (Number(referAndEarn.blockValues.rewardToReferrer) > 0) {
                                    await customer_wallet_transaction_model_1.default.create({
                                        customerId: referralCodeWithCustomerData._id,
                                        referredCustomerId: existCustomer._id, //referrer
                                        earnType: wallet_1.earnTypes.referrer,
                                        referredCode: referralCode,
                                        walletAmount: (0, helpers_1.calculateWalletAmount)(referAndEarn.blockValues.rewardToReferrer, referAndEarn.blockValues),
                                        walletPoints: referAndEarn.blockValues.rewardToReferrer,
                                        status: '0'
                                    });
                                }
                                if (Number(referAndEarn.blockValues.rewardToReferred) > 0) {
                                    await customer_wallet_transaction_model_1.default.create({
                                        customerId: existCustomer._id,
                                        referrerCustomerId: referralCodeWithCustomerData._id, //rewardToReferred
                                        earnType: wallet_1.earnTypes.referred,
                                        referredCode: referralCode,
                                        walletAmount: (0, helpers_1.calculateWalletAmount)(referAndEarn.blockValues.rewardToReferred, referAndEarn.blockValues),
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
                    let websiteSettingsQuery = { _id: { $exists: true } };
                    websiteSettingsQuery = {
                        ...websiteSettingsQuery,
                        countryId: existCustomer.countryId,
                        block: website_setup_1.websiteSetup.basicSettings,
                        blockReference: { $in: [website_setup_1.blockReferences.defualtSettings, website_setup_1.blockReferences.basicDetailsSettings, website_setup_1.blockReferences.socialMedia, website_setup_1.blockReferences.appUrls] },
                        status: '1',
                    };
                    const settingsDetails = await website_setup_model_1.default.find(websiteSettingsQuery);
                    if (settingsDetails) {
                        const basicDetailsSettings = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.basicDetailsSettings)?.blockValues;
                        const socialMedia = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.socialMedia)?.blockValues;
                        const appUrls = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.appUrls)?.blockValues;
                        const emailTemplate = ejs.renderFile(path_1.default.join(__dirname, '../../../views/email', 'email-otp.ejs'), {
                            otp: existCustomer.otp,
                            firstName: existCustomer.firstName,
                            storeEmail: basicDetailsSettings?.storeEmail,
                            storePhone: basicDetailsSettings?.storePhone,
                            shopDescription: convert(basicDetailsSettings?.shopDescription, options),
                            socialMedia,
                            appUrls,
                            subject: messages_1.subjects.verificationOTP,
                            shopLogo: `${process.env.SHOPLOGO}`,
                            shopName: `${process.env.SHOPNAME}`,
                            appUrl: `${process.env.APPURL}`
                        }, async (err, template) => {
                            if (err) {
                                console.log(err);
                                return;
                            }
                            if (process.env.SHOPNAME === 'Timehouse') {
                                const sendEmail = await (0, mail_chimp_sms_gateway_1.mailChimpEmailGateway)({ ...existCustomer.toObject(), subject: messages_1.subjects.verificationOTP }, template);
                            }
                            else if (process.env.SHOPNAME === 'Homestyle') {
                                const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({ ...existCustomer.toObject(), subject: messages_1.subjects.verificationOTP }, template);
                                const sendsms = await (0, bulk_sms_gateway_1.bulkSmsGateway)({ ...existCustomer.toObject(), message: (0, messages_1.registerOtp)(process.env.SHOPNAME, Number(existCustomer.otp)) });
                            }
                            else if (process.env.SHOPNAME === 'Beyondfresh') {
                                const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({ ...existCustomer.toObject(), subject: messages_1.subjects.verificationOTP }, template);
                            }
                            else if (process.env.SHOPNAME === 'Smartbaby') {
                                const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({ ...existCustomer.toObject(), subject: messages_1.subjects.verificationOTP }, template);
                            }
                        });
                    }
                }
                else {
                    await customers_model_1.default.findOneAndUpdate(existCustomer._id, {
                        isGuest: false,
                        email,
                        firstName,
                        phone,
                        password: await bcrypt_1.default.hash(password, 10),
                        otp: (0, helpers_1.generateOTP)(4),
                        otpExpiry,
                        referralCode: generatedReferralCode,
                        status: '1',
                        failureAttemptsCount: 0,
                        createdAt: new Date()
                    });
                }
                if (existCustomer) {
                    const payload = {
                        userId: existCustomer._id,
                        email: existCustomer.email,
                        phone: existCustomer.phone,
                        firstName: existCustomer.firstName,
                        ...(existCustomer.isGuest ? {} : { totalWalletAmount: existCustomer.totalWalletAmount })
                    };
                    const token = jsonwebtoken_1.default.sign(payload, `${process.env.TOKEN_SECRET_KEY}`, { expiresIn: '10y' });
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
    async guestRegister(req, res) {
        try {
            const validatedData = auth_schema_1.guestRegisterSchema.safeParse(req.body);
            if (validatedData.success) {
                const { email, phone, otpType } = validatedData.data;
                const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
                const currentDate = new Date();
                const otpExpiry = new Date(currentDate.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours to current time
                let newCustomer = await customers_model_1.default.findOne({
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
                        otp: (0, helpers_1.generateOTP)(4),
                        otpExpiry,
                        isGuest: true,
                        status: '1',
                        failureAttemptsCount: 0,
                        guestRegisterCount: 1,
                        createdAt: new Date()
                    };
                    newCustomer = await customer_service_1.default.create(customerData);
                }
                else {
                    newCustomer = await customer_service_1.default.update(newCustomer._id, {
                        guestUserId: uuid,
                        guestRegisterCount: ((newCustomer?.guestRegisterCount > 0 ? newCustomer.guestRegisterCount + 1 : 1) || 1),
                        isGuest: true,
                        otp: (0, helpers_1.generateOTP)(4),
                        otpExpiry,
                        failureAttemptsCount: 0,
                        guestPhone: phone,
                        email: email,
                    });
                    newCustomer = {
                        ...newCustomer.toObject(),
                        phone: phone,
                        email: email,
                    };
                }
                if (newCustomer) {
                    let websiteSettingsQuery = { _id: { $exists: true } };
                    websiteSettingsQuery = {
                        ...websiteSettingsQuery,
                        countryId: newCustomer.countryId,
                        block: website_setup_1.websiteSetup.basicSettings,
                        blockReference: { $in: [website_setup_1.blockReferences.defualtSettings, website_setup_1.blockReferences.basicDetailsSettings, website_setup_1.blockReferences.socialMedia, website_setup_1.blockReferences.appUrls] },
                        status: '1',
                    };
                    const settingsDetails = await website_setup_model_1.default.find(websiteSettingsQuery);
                    if (settingsDetails) {
                        const basicDetailsSettings = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.basicDetailsSettings)?.blockValues;
                        const socialMedia = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.socialMedia)?.blockValues;
                        const appUrls = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.appUrls)?.blockValues;
                        const emailTemplate = ejs.renderFile(path_1.default.join(__dirname, '../../../views/email', 'email-otp.ejs'), {
                            otp: newCustomer.otp,
                            firstName: newCustomer.firstName,
                            storeEmail: basicDetailsSettings?.storeEmail,
                            storePhone: basicDetailsSettings?.storePhone,
                            shopDescription: convert(basicDetailsSettings?.shopDescription, options),
                            socialMedia,
                            appUrls,
                            subject: messages_1.subjects.verificationOTP,
                            shopLogo: `${process.env.SHOPLOGO}`,
                            shopName: `${process.env.SHOPNAME}`,
                            appUrl: `${process.env.APPURL}`
                        }, async (err, template) => {
                            if (err) {
                                console.log("email eroor", err);
                                return;
                            }
                            if (process.env.SHOPNAME === 'Timehouse') {
                                const sendEmail = await (0, mail_chimp_sms_gateway_1.mailChimpEmailGateway)({ ...newCustomer, subject: messages_1.subjects.verificationOTP }, template);
                            }
                            else if (process.env.SHOPNAME === 'Homestyle') {
                                const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({ ...newCustomer, subject: messages_1.subjects.verificationOTP }, template);
                                const sendsms = await (0, bulk_sms_gateway_1.bulkSmsGateway)({ ...newCustomer, message: (0, messages_1.guestRegisterOtp)(process.env.SHOPNAME, newCustomer.otp) });
                            }
                            else if (process.env.SHOPNAME === 'Beyondfresh') {
                                const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({ ...newCustomer, subject: messages_1.subjects.verificationOTP }, template);
                            }
                            else if (process.env.SHOPNAME === 'Smartbaby') {
                                const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({ ...newCustomer, subject: messages_1.subjects.verificationOTP }, template);
                            }
                        });
                    }
                    return controller.sendSuccessResponse(res, {
                        requestedData: {
                            userId: newCustomer._id,
                            email: newCustomer.email,
                            phone: newCustomer.phone,
                            isVerified: newCustomer.isVerified,
                            isGuest: newCustomer.isGuest,
                            guestRegisterCount: newCustomer.guestRegisterCount,
                        },
                        message: 'Customer created successfully! An OTP has been sent to your email for verification.'
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
    async login(req, res) {
        try {
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                const validatedData = auth_schema_1.loginSchema.safeParse(req.body);
                if (validatedData.success) {
                    const { email, password } = validatedData.data;
                    const user = await customers_model_1.default.findOne({ email: email, status: '1' });
                    if (user && user.password !== '') {
                        const isPasswordValid = user.password ? await bcrypt_1.default.compare(password, user.password) : false;
                        if (isPasswordValid) {
                            const updateData = {
                                lastLoggedAt: new Date()
                            };
                            if (user?.isGuest) {
                                updateData.isGuest = false;
                            }
                            await customer_service_1.default.update(user._id, updateData);
                            const token = jsonwebtoken_1.default.sign({
                                userId: user._id,
                                email: user.email,
                                phone: user.phone,
                                firstName: user.firstName,
                                totalWalletAmount: user.totalWalletAmount,
                            }, `${process.env.TOKEN_SECRET_KEY}`);
                            if (!user.isVerified) {
                                let websiteSettingsQuery = { _id: { $exists: true } };
                                websiteSettingsQuery = {
                                    ...websiteSettingsQuery,
                                    countryId: user.countryId,
                                    block: website_setup_1.websiteSetup.basicSettings,
                                    blockReference: { $in: [website_setup_1.blockReferences.defualtSettings, website_setup_1.blockReferences.basicDetailsSettings, website_setup_1.blockReferences.socialMedia, website_setup_1.blockReferences.appUrls] },
                                    status: '1',
                                };
                                const settingsDetails = await website_setup_model_1.default.find(websiteSettingsQuery);
                                if (settingsDetails) {
                                    const basicDetailsSettings = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.basicDetailsSettings)?.blockValues;
                                    const socialMedia = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.socialMedia)?.blockValues;
                                    const appUrls = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.appUrls)?.blockValues;
                                    const emailTemplate = ejs.renderFile(path_1.default.join(__dirname, '../../../views/email', 'email-otp.ejs'), {
                                        otp: user.otp,
                                        firstName: user.firstName,
                                        storeEmail: basicDetailsSettings?.storeEmail,
                                        storePhone: basicDetailsSettings?.storePhone,
                                        shopDescription: convert(basicDetailsSettings?.shopDescription, options),
                                        socialMedia,
                                        appUrls,
                                        subject: messages_1.subjects.verificationOTP,
                                        shopLogo: `${process.env.SHOPLOGO}`,
                                        shopName: `${process.env.SHOPNAME}`,
                                        appUrl: `${process.env.APPURL}`
                                    }, async (err, template) => {
                                        if (err) {
                                            console.log(err);
                                            return;
                                        }
                                        if (process.env.SHOPNAME === 'Timehouse') {
                                            const sendEmail = await (0, mail_chimp_sms_gateway_1.mailChimpEmailGateway)({ ...user.toObject(), subject: messages_1.subjects.verificationOTP }, template);
                                        }
                                        else if (process.env.SHOPNAME === 'Homestyle') {
                                            const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({ ...user.toObject(), subject: messages_1.subjects.verificationOTP }, template);
                                            const sendsms = await (0, bulk_sms_gateway_1.bulkSmsGateway)({ ...user.toObject(), message: (0, messages_1.resendOtp)(Number(user.otp)) });
                                        }
                                        else if (process.env.SHOPNAME === 'Beyondfresh') {
                                            const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({ ...user.toObject(), subject: messages_1.subjects.verificationOTP }, template);
                                        }
                                        else if (process.env.SHOPNAME === 'Smartbaby') {
                                            const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({ ...user.toObject(), subject: messages_1.subjects.verificationOTP }, template);
                                        }
                                    });
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
    async forgotPassword(req, res) {
        try {
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                const validatedData = auth_schema_1.forgotPasswordSchema.safeParse(req.body);
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
                            otp: (0, helpers_1.generateOTP)(4),
                            otpExpiry,
                        };
                        const updatedCustomer = await customer_service_1.default.update(existingUser?.id, updateCustomerOtp);
                        if (updatedCustomer) {
                            let websiteSettingsQuery = { _id: { $exists: true } };
                            websiteSettingsQuery = {
                                ...websiteSettingsQuery,
                                countryId: updatedCustomer.countryId,
                                block: website_setup_1.websiteSetup.basicSettings,
                                blockReference: { $in: [website_setup_1.blockReferences.basicDetailsSettings, website_setup_1.blockReferences.socialMedia, website_setup_1.blockReferences.appUrls] },
                                status: '1',
                            };
                            const settingsDetails = await website_setup_model_1.default.find(websiteSettingsQuery);
                            if (settingsDetails) {
                                const basicDetailsSettings = await settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.basicDetailsSettings)?.blockValues;
                                const socialMedia = await settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.socialMedia)?.blockValues;
                                const appUrls = await settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.appUrls)?.blockValues;
                                const emailTemplate = ejs.renderFile(path_1.default.join(__dirname, '../../../views/email', 'email-otp.ejs'), {
                                    otp: updatedCustomer.otp,
                                    firstName: updatedCustomer.firstName,
                                    storeEmail: basicDetailsSettings?.storeEmail,
                                    storePhone: basicDetailsSettings?.storePhone,
                                    shopDescription: convert(basicDetailsSettings?.shopDescription, options),
                                    socialMedia,
                                    appUrls,
                                    subject: messages_1.subjects.passwordResetConfirmation,
                                    shopLogo: `${process.env.SHOPLOGO}`,
                                    shopName: `${process.env.SHOPNAME}`,
                                    appUrl: `${process.env.APPURL}`
                                }, async (err, template) => {
                                    if (err) {
                                        console.log(err);
                                        return;
                                    }
                                    if (process.env.SHOPNAME === 'Timehouse') {
                                        const sendEmail = await (0, mail_chimp_sms_gateway_1.mailChimpEmailGateway)({ email: updatedCustomer.email, subject: messages_1.subjects.passwordResetConfirmation }, template);
                                    }
                                    else if (process.env.SHOPNAME === 'Homestyle') {
                                        const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({ email: updatedCustomer.email, subject: messages_1.subjects.passwordResetConfirmation }, template);
                                        const sendsms = await (0, bulk_sms_gateway_1.bulkSmsGateway)({ ...updatedCustomer.toObject(), message: (0, messages_1.resetPasswordOtp)(Number(updatedCustomer.otp)) });
                                    }
                                    else if (process.env.SHOPNAME === 'Beyondfresh') {
                                        const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({ email: updatedCustomer.email, subject: messages_1.subjects.passwordResetConfirmation }, template);
                                    }
                                    else if (process.env.SHOPNAME === 'Smartbaby') {
                                        const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({ email: updatedCustomer.email, subject: messages_1.subjects.passwordResetConfirmation }, template);
                                    }
                                });
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
    async resetPassword(req, res) {
        try {
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                const validatedData = auth_schema_1.resetPasswordFormSchema.safeParse(req.body);
                if (validatedData.success) {
                    const { password, confirmPassword, otp, email } = validatedData.data;
                    const checkValidOtp = await customer_service_1.default.findOne({ email: email, otp });
                    if (checkValidOtp) {
                        const currentTime = new Date();
                        if (checkValidOtp.otpExpiry && currentTime <= checkValidOtp.otpExpiry) {
                            const updatedCustomer = await customer_service_1.default.update(checkValidOtp?.id, {
                                password: await bcrypt_1.default.hash(password, 10),
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
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Invalid OTP!',
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
            const validatedData = auth_schema_1.resendOtpSchema.safeParse(req.body);
            if (userId) {
                if (validatedData.success) {
                    const customerData = await customer_service_1.default.findOne({ _id: userId, status: '1' });
                    if (customerData) {
                        const currentDate = new Date();
                        const otpExpiry = new Date(currentDate.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours to current time
                        const optUpdatedCustomer = await customer_service_1.default.update(customerData._id, {
                            otp: (0, helpers_1.generateOTP)(4),
                            otpExpiry,
                        });
                        if (optUpdatedCustomer) {
                            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
                            let websiteSettingsQuery = { _id: { $exists: true } };
                            websiteSettingsQuery = {
                                ...websiteSettingsQuery,
                                countryId: optUpdatedCustomer.countryId,
                                block: website_setup_1.websiteSetup.basicSettings,
                                blockReference: { $in: [website_setup_1.blockReferences.defualtSettings, website_setup_1.blockReferences.basicDetailsSettings, website_setup_1.blockReferences.socialMedia, website_setup_1.blockReferences.appUrls] },
                                status: '1',
                            };
                            const settingsDetails = await website_setup_model_1.default.find(websiteSettingsQuery);
                            if (settingsDetails) {
                                const basicDetailsSettings = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.basicDetailsSettings)?.blockValues;
                                const socialMedia = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.socialMedia)?.blockValues;
                                const appUrls = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.appUrls)?.blockValues;
                                const emailTemplate = ejs.renderFile(path_1.default.join(__dirname, '../../../views/email', 'email-otp.ejs'), {
                                    otp: optUpdatedCustomer.otp,
                                    firstName: optUpdatedCustomer.firstName,
                                    storeEmail: basicDetailsSettings?.storeEmail,
                                    storePhone: basicDetailsSettings?.storePhone,
                                    shopDescription: convert(basicDetailsSettings?.shopDescription, options),
                                    socialMedia,
                                    appUrls,
                                    subject: messages_1.subjects.resentVerificationOTP,
                                    shopLogo: `${process.env.SHOPLOGO}`,
                                    shopName: `${process.env.SHOPNAME}`,
                                    appUrl: `${process.env.APPURL}`
                                }, async (err, template) => {
                                    if (err) {
                                        console.log(err);
                                        return;
                                    }
                                    if (process.env.SHOPNAME === 'Timehouse') {
                                        const sendEmail = await (0, mail_chimp_sms_gateway_1.mailChimpEmailGateway)({ email: optUpdatedCustomer.email, subject: messages_1.subjects.resentVerificationOTP }, template);
                                    }
                                    else if (process.env.SHOPNAME === 'Homestyle') {
                                        const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({ email: optUpdatedCustomer.email, subject: messages_1.subjects.resentVerificationOTP }, template);
                                        const sendsms = await (0, bulk_sms_gateway_1.bulkSmsGateway)({ ...optUpdatedCustomer.toObject(), message: (0, messages_1.resendOtp)(Number(optUpdatedCustomer.otp)) });
                                    }
                                    else if (process.env.SHOPNAME === 'Beyondfresh') {
                                        const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({ email: optUpdatedCustomer.email, subject: messages_1.subjects.resentVerificationOTP }, template);
                                    }
                                    else if (process.env.SHOPNAME === 'Smartbaby') {
                                        const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({ email: optUpdatedCustomer.email, subject: messages_1.subjects.resentVerificationOTP }, template);
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
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                const validatedData = auth_schema_1.verifyOtpSchema.safeParse(req.body);
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
                                    if (!updatedCustomer?.isGuest) {
                                        const checkReferredCode = await customer_wallet_transaction_model_1.default.findOne({
                                            referredCustomerId: updatedCustomer._id,
                                            status: '0',
                                            referralCode: { $ne: '' }
                                        });
                                        if (checkReferredCode) {
                                            const referrerCustomer = await customer_wallet_transaction_model_1.default.findByIdAndUpdate(checkReferredCode._id, {
                                                status: '1'
                                            });
                                            const referredCustomer = await customer_wallet_transaction_model_1.default.findOne({
                                                referrerCustomerId: checkReferredCode.customerId,
                                                status: '0',
                                                referralCode: { $ne: '' }
                                            });
                                            if (referrerCustomer) {
                                                const referrerCustomerData = await customer_service_1.default.findOne({ _id: referrerCustomer?.customerId });
                                                if (referrerCustomerData) {
                                                    await customer_service_1.default.update(referrerCustomerData?._id, { totalRewardPoint: (referrerCustomerData.totalRewardPoint + referrerCustomer.walletPoints), totalWalletAmount: (referrerCustomerData.totalWalletAmount + referrerCustomer.walletAmount) });
                                                }
                                            }
                                            if (referredCustomer) {
                                                await customer_wallet_transaction_model_1.default.findByIdAndUpdate(referredCustomer._id, {
                                                    status: '1'
                                                });
                                                const referredCustomerData = await customer_service_1.default.findOne({ _id: referredCustomer?.customerId });
                                                if (referredCustomerData) {
                                                    await customer_service_1.default.update(referredCustomerData?._id, { totalRewardPoint: (referredCustomerData.totalRewardPoint + referredCustomer.walletPoints), totalWalletAmount: (referredCustomerData.totalWalletAmount + referredCustomer.walletAmount) });
                                                }
                                            }
                                        }
                                    }
                                    const payload = {
                                        userId: updatedCustomer._id,
                                        email: updatedCustomer.email,
                                        phone: updatedCustomer.phone,
                                        firstName: updatedCustomer.firstName,
                                        ...(updatedCustomer.isGuest ? {} : { totalWalletAmount: updatedCustomer.totalWalletAmount })
                                    };
                                    const expiresIn = updatedCustomer.isGuest ? '1h' : '10y';
                                    const token = jsonwebtoken_1.default.sign(payload, `${process.env.TOKEN_SECRET_KEY}`, { expiresIn });
                                    await customer_service_1.default.update(updatedCustomer._id, {
                                        lastLoggedAt: new Date()
                                    });
                                    if (updatedCustomer?.isGuest) {
                                        const existingCart = await cart_order_model_1.default.findOne({ customerId: updatedCustomer._id, cartStatus: '1' });
                                        if (existingCart) {
                                            await cart_order_model_1.default.findOneAndDelete({ _id: existingCart._id });
                                            await cart_order_product_model_1.default.deleteMany({ cartId: existingCart._id });
                                        }
                                        const uuid = req.header('User-Token');
                                        const guestUserCart = await cart_order_model_1.default.findOneAndUpdate({ guestUserId: uuid, cartStatus: '1' }, { $set: { customerId: updatedCustomer._id, isGuest: true, guestUserId: null } }, { new: true });
                                    }
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
}
exports.default = new GuestController();

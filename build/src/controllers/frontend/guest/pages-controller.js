"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const ejs = require('ejs');
const { convert } = require('html-to-text');
const helpers_1 = require("../../../utils/helpers");
const website_setup_1 = require("../../../constants/website-setup");
const contact_us_schema_1 = require("../../../utils/schemas/frontend/auth/contact-us-schema");
const mail_chimp_sms_gateway_1 = require("../../../lib/emails/mail-chimp-sms-gateway");
const smtp_nodemailer_gateway_1 = require("../../../lib/emails/smtp-nodemailer-gateway");
const newsletter_schema_1 = require("../../../utils/schemas/frontend/auth/newsletter-schema");
const base_controller_1 = __importDefault(require("../../admin/base-controller"));
const common_service_1 = __importDefault(require("../../../services/frontend/guest/common-service"));
const pages_service_1 = __importDefault(require("../../../services/frontend/guest/pages-service"));
const contact_us_service_1 = __importDefault(require("../../../services/frontend/guest/contact-us-service"));
const website_setup_model_1 = __importDefault(require("../../../model/admin/setup/website-setup-model"));
const newsletter_service_1 = __importDefault(require("../../../services/frontend/guest/newsletter-service"));
const newsletter_model_1 = __importDefault(require("../../../model/frontend/newsletter-model"));
const controller = new base_controller_1.default();
class PageController extends base_controller_1.default {
    async findPagesData(req, res) {
        try {
            const pageSlug = req.params.slug;
            if ((0, helpers_1.checkValueExists)(website_setup_1.blockReferences, pageSlug)) {
                let query = { _id: { $exists: true } };
                const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
                // let countryId = await CommonService.findOneCountrySubDomainWithId(hostName);
                if (countryId) {
                    query = {
                        ...query,
                        countryId,
                        block: website_setup_1.websiteSetup.pages,
                        blockReference: pageSlug,
                        status: '1',
                    };
                    const websiteSetup = await pages_service_1.default.findPagesData({
                        limit: 500,
                        hostName: req.get('origin'),
                        block: website_setup_1.websiteSetup.pages,
                        blockReference: pageSlug,
                        query,
                    });
                    let shipmentDetails = null;
                    if (pageSlug === website_setup_1.blockReferences.shipmentAndDeliveryPolicy) {
                        shipmentDetails = await website_setup_model_1.default.findOne({
                            block: website_setup_1.websiteSetup.basicSettings,
                            blockReference: website_setup_1.blockReferences.shipmentSettings
                        });
                        if (shipmentDetails && shipmentDetails.blockValues) {
                            shipmentDetails = shipmentDetails.blockValues;
                        }
                    }
                    return controller.sendSuccessResponse(res, {
                        requestedData: {
                            ...websiteSetup,
                            ...(shipmentDetails ? { shipmentDetails } : {})
                        },
                        message: 'Success!'
                    }, 200);
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Error',
                        validation: 'block and blockReference is missing! please check'
                    }, req);
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'Invalid page'
                }, req);
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching ' });
        }
    }
    async contactUsSubmit(req, res) {
        const validatedData = contact_us_schema_1.contactUsSchema.safeParse(req.body);
        if (!validatedData.success) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Validation error',
                validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
            });
        }
        const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
        if (!countryId) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Country is missing',
            });
        }
        const { name, email, phone, subject, message } = validatedData.data;
        const customerId = res.locals.user || null;
        // const guestUser = res.locals.uuid || null;
        const insertContactUsData = {
            customerId,
            countryId,
            name,
            email,
            phone,
            subject,
            message
        };
        const contactUs = await contact_us_service_1.default.create(insertContactUsData);
        if (contactUs) {
            let websiteSettingsQuery = { _id: { $exists: true } };
            websiteSettingsQuery = {
                ...websiteSettingsQuery,
                countryId,
                block: website_setup_1.websiteSetup.basicSettings,
                blockReference: { $in: [website_setup_1.blockReferences.defualtSettings, website_setup_1.blockReferences.basicDetailsSettings, website_setup_1.blockReferences.socialMedia, website_setup_1.blockReferences.appUrls] },
                status: '1',
            };
            const settingsDetails = await website_setup_model_1.default.find(websiteSettingsQuery);
            if (settingsDetails) {
                const basicDetailsSettings = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.basicDetailsSettings)?.blockValues;
                const socialMedia = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.socialMedia)?.blockValues;
                const appUrls = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.appUrls)?.blockValues;
                const emailTemplate = ejs.renderFile(path_1.default.join(__dirname, '../../../views/email', 'email-contact-us.ejs'), {
                    subject,
                    name,
                    email,
                    phone,
                    message,
                    storeEmail: basicDetailsSettings?.storeEmail,
                    storePhone: basicDetailsSettings?.storePhone,
                    shopDescription: convert(basicDetailsSettings?.shopDescription, {
                        wordwrap: 130,
                    }),
                    socialMedia,
                    appUrls,
                    shopLogo: `${process.env.SHOPLOGO}`,
                    shopName: `${process.env.SHOPNAME}`,
                    appUrl: `${process.env.APPURL}`
                }, async (err, template) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    const emailValues = {
                        subject,
                        email: basicDetailsSettings?.storeEmail,
                        // ccmail: 
                    };
                    if (process.env.SHOPNAME === 'Timehouse') {
                        const sendEmail = await (0, mail_chimp_sms_gateway_1.mailChimpEmailGateway)(emailValues, template);
                    }
                    else if (process.env.SHOPNAME === 'Homestyle') {
                        console.log(emailValues);
                        const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)(emailValues, template);
                    }
                    else if (process.env.SHOPNAME === 'Beyondfresh') {
                        const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)(emailValues, template);
                    }
                    else if (process.env.SHOPNAME === 'Smartbaby') {
                        const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)(emailValues, template);
                    }
                });
            }
            return controller.sendSuccessResponse(res, {
                requestedData: contactUs,
                message: 'Thank you for reaching out! We have received your message and will get back to you shortly'
            }, 200);
        }
        else {
            return controller.sendErrorResponse(res, 200, {
                message: 'Something went wrong! Please try again',
            });
        }
    }
    async newsletterSubmit(req, res) {
        const validatedData = newsletter_schema_1.newsletterSchema.safeParse(req.body);
        if (!validatedData.success) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Validation error',
                validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
            });
        }
        const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
        if (!countryId) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Country is missing',
            });
        }
        const { email } = validatedData.data;
        let subscriber = await newsletter_model_1.default.findOne({ email });
        if (subscriber) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Email is already subscribed',
            });
        }
        const customerId = res.locals.user || null;
        const insertNewsletterData = {
            customerId,
            countryId,
            email
        };
        const newsletter = await newsletter_service_1.default.create(insertNewsletterData);
        if (newsletter) {
            return controller.sendSuccessResponse(res, {
                requestedData: newsletter,
                message: 'You have subscribed successfully!'
            }, 200);
        }
        else {
            return controller.sendErrorResponse(res, 200, {
                message: 'Something went wrong! Please try again',
            });
        }
    }
}
exports.default = new PageController;

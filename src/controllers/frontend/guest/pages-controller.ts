import { Request, Response, response } from 'express';
import path from 'path';
const ejs = require('ejs');
const { convert } = require('html-to-text');

import { checkValueExists, formatZodError } from '../../../utils/helpers';
import { blockReferences, websiteSetup, websiteSetup as websiteSetupObjects } from '../../../constants/website-setup';
import { contactUsSchema } from '../../../utils/schemas/frontend/auth/contact-us-schema';
import { mailChimpEmailGateway } from '../../../lib/emails/mail-chimp-sms-gateway';
import { smtpEmailGateway } from '../../../lib/emails/smtp-nodemailer-gateway';
import { newsletterSchema } from '../../../utils/schemas/frontend/auth/newsletter-schema';

import BaseController from "../../admin/base-controller";
import CommonService from '../../../services/frontend/guest/common-service';
import PagesService from '../../../services/frontend/guest/pages-service';
import ContactUsService from '../../../services/frontend/guest/contact-us-service';
import WebsiteSetupModel from '../../../model/admin/setup/website-setup-model';
import NewsletterService from '../../../services/frontend/guest/newsletter-service';
import NewsletterModel from '../../../model/frontend/newsletter-model';

const controller = new BaseController();

class PageController extends BaseController {

    async findPagesData(req: Request, res: Response): Promise<void> {
        try {
            const pageSlug = req.params.slug
            if (checkValueExists(blockReferences, pageSlug)) {

                let query: any = { _id: { $exists: true } };
                const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));

                // let countryId = await CommonService.findOneCountrySubDomainWithId(hostName);
                if (countryId) {
                    query = {
                        ...query,
                        countryId,
                        block: websiteSetupObjects.pages,
                        blockReference: pageSlug,
                        status: '1',
                    } as any;

                    const websiteSetup = await PagesService.findPagesData({
                        limit: 500,
                        hostName: req.get('origin'),
                        block: websiteSetupObjects.pages,
                        blockReference: pageSlug,
                        query,
                    });
                    let shipmentDetails = null;
                    if (pageSlug === blockReferences.shipmentAndDeliveryPolicy) {
                        shipmentDetails = await WebsiteSetupModel.findOne({
                            block: websiteSetupObjects.basicSettings,
                            blockReference: blockReferences.shipmentSettings
                        });
                        if (shipmentDetails && shipmentDetails.blockValues) {
                            shipmentDetails = shipmentDetails.blockValues
                        }
                    }

                    return controller.sendSuccessResponse(res, {
                        requestedData: {
                            ...websiteSetup,
                            ...(shipmentDetails ? { shipmentDetails } : {})
                        },
                        message: 'Success!'
                    }, 200);
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Error',
                        validation: 'block and blockReference is missing! please check'
                    }, req);
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'Invalid page'
                }, req);
            }
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching ' });
        }
    }

    async contactUsSubmit(req: Request, res: Response): Promise<void> {
        const validatedData = contactUsSchema.safeParse(req.body);
        if (!validatedData.success) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Validation error',
                validation: formatZodError(validatedData.error.errors)
            });
        }
        const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
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
        }
        const contactUs = await ContactUsService.create(insertContactUsData);
        if (contactUs) {
            let websiteSettingsQuery: any = { _id: { $exists: true } };
            websiteSettingsQuery = {
                ...websiteSettingsQuery,
                countryId,
                block: websiteSetup.basicSettings,
                blockReference: { $in: [blockReferences.defualtSettings, blockReferences.basicDetailsSettings, blockReferences.socialMedia, blockReferences.appUrls] },
                status: '1',
            } as any;

            const settingsDetails = await WebsiteSetupModel.find(websiteSettingsQuery);
            if (settingsDetails) {
                const basicDetailsSettings = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.basicDetailsSettings)?.blockValues;
                const socialMedia = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.socialMedia)?.blockValues;
                const appUrls = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.appUrls)?.blockValues;
                const emailTemplate = ejs.renderFile(path.join(__dirname, '../../../views/email', 'email-contact-us.ejs'),
                    {
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
                    },
                    async (err: any, template: any) => {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        const emailValues = {
                            subject,
                            email,
                            ccmail: [basicDetailsSettings?.storeEmail]
                        }
                        if (process.env.SHOPNAME === 'Timehouse') {
                            const sendEmail = await mailChimpEmailGateway(emailValues, template);
                        } else if (process.env.SHOPNAME === 'Homestyle') {
                            const sendEmail = await smtpEmailGateway(emailValues, template);
                        } else if (process.env.SHOPNAME === 'Beyondfresh') {
                            const sendEmail = await smtpEmailGateway(emailValues, template);
                        } else if (process.env.SHOPNAME === 'Smartbaby') {
                            const sendEmail = await smtpEmailGateway(emailValues, template);
                        }
                    })
            }
            return controller.sendSuccessResponse(res, {
                requestedData: contactUs,
                message: 'Thank you for reaching out! We have received your message and will get back to you shortly'
            }, 200);
        } else {
            return controller.sendErrorResponse(res, 200, {
                message: 'Something went wrong! Please try again',
            });
        }
    }

    async newsletterSubmit(req: Request, res: Response): Promise<void> {
        const validatedData = newsletterSchema.safeParse(req.body);

        if (!validatedData.success) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Validation error',
                validation: formatZodError(validatedData.error.errors)
            });
        }
        const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
        if (!countryId) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Country is missing',
            });
        }
        const { email } = validatedData.data;
        let subscriber = await NewsletterModel.findOne({ email });

        if (subscriber) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Email is already subscribed',
            });
        }
        const customerId: any = res.locals.user || null;

        const insertNewsletterData = {
            customerId,
            countryId,
            email
        }
        const newsletter = await NewsletterService.create(insertNewsletterData);
        if (newsletter) {
            return controller.sendSuccessResponse(res, {
                requestedData: newsletter,
                message: 'You have subscribed successfully!'
            }, 200);
        } else {
            return controller.sendErrorResponse(res, 200, {
                message: 'Something went wrong! Please try again',
            });
        }
    }

}



export default new PageController;
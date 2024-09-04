import { Request, Response } from "express";
import path from "path";
const ejs = require('ejs');
const { convert } = require('html-to-text');

import { calculateExpectedDeliveryDate } from "../helpers";
import { blockReferences } from "../../constants/website-setup";
import { orderProductCancelStatusMessages, orderProductStatussMessages, orderReturnStatusMessages, orderStatusArrayJson, orderStatusMessages } from "../../constants/cart";
import { mailChimpEmailGateway } from "../../lib/emails/mail-chimp-sms-gateway";
import { smtpEmailGateway } from "../../lib/emails/smtp-nodemailer-gateway";
import { pdfGenerator } from "../../lib/pdf/pdf-generator";
import { bulkSmsGateway } from "../../lib/sms/bulk-sms-gateway";
import { cancelOrder, deliveredOrder, shippingOrder } from "../../constants/messages";

export const findOrderStatusDateCheck = (orderStatus: any) => {
    let statusAt
    switch (orderStatus) {
        case '1':
            statusAt = 'orderStatusAt';
            break;
        case '2':
            statusAt = 'processingStatusAt';
            break;
        case '3':
            statusAt = 'packedStatusAt';
            break;
        case '4':
            statusAt = 'shippedStatusAt';
            break;
        case '5':
            statusAt = 'deliveredStatusAt';
            break;
        case '6':
            statusAt = 'canceledStatusAt';
            break;
        case '7':
            statusAt = 'returnedStatusAt';
            break;
        case '8':
            statusAt = 'refundedStatusAt';
            break;
        case '9':
            statusAt = 'partiallyShippedStatusAt';
            break;
        case '10':
            statusAt = 'onHoldStatusAt';
            break;
        case '11':
            statusAt = 'failedStatusAt';
            break;
        case '12':
            statusAt = 'completedStatusAt';
            break;
        case '13':
            statusAt = 'pickupStatusAt';
            break;
        case '14':
            statusAt = 'partiallyDeliveredStatusAt';
            break;
        case '15':
            statusAt = 'partiallyCanceledStatusAt';
            break;
        case '16':
            statusAt = 'partiallyReturnedStatusAt';
            break;
        case '17':
            statusAt = 'partiallyRefundedStatusAt';
            break;

        default:
            statusAt = '';
            break;
    }
    return statusAt

}

export const invoicePdfGenerator = async (res: Response, req: Request, orderDetails: any, basicDetailsSettings: any, tax: any, expectedDeliveryDate: any, currencyCode: any) => {
    const pdfGenerateData = {
        orderDetails: orderDetails[0],
        expectedDeliveryDate,
        storeEmail: basicDetailsSettings?.storeEmail,
        storePhone: basicDetailsSettings?.storePhone,
        storeAppartment: basicDetailsSettings?.storeAppartment,
        storeStreet: basicDetailsSettings?.storeStreet,
        storeCity: basicDetailsSettings?.storeCity,
        storeState: basicDetailsSettings?.storeState,
        storePostalCode: basicDetailsSettings?.storePostalCode,
        TRNNo: basicDetailsSettings?.TRNNo,
        tollFreeNo: basicDetailsSettings?.tollFreeNo,
        shopName: basicDetailsSettings?.shopName || `${process.env.SHOPNAME}`,
        shopLogo: `${process.env.SHOPLOGO}`,
        shop: `${process.env.SHOPNAME}`,
        appUrl: `${process.env.APPURL}`,
        apiAppUrl: `${process.env.APP_API_URL}`,
        tax: tax,
        currencyCode: currencyCode
    }
    if (req.query.deliverySlip === '1') {
        ejs.renderFile(path.join(__dirname, '../../views/order', 'delivery-slip-invoice.ejs'),
            pdfGenerateData,
            async (err: any, html: any) => {
                if (err) {
                    return false
                }
                await pdfGenerator({ html, res, preview: req.query.preview })
            });
    } else if (req.query.customer === '1') {
        ejs.renderFile(path.join(__dirname, '../../views/order', 'customer-invoice.ejs'),
            pdfGenerateData,
            async (err: any, html: any) => {
                if (err) {
                    return false
                }
                await pdfGenerator({ html, res, preview: req.query.preview })
            });
    } else if (req.query.purchaseOrder === '1') {
        ejs.renderFile(path.join(__dirname, '../../views/order', 'purchase-order-invoice.ejs'),
            pdfGenerateData,
            async (err: any, html: any) => {
                if (err) {
                    return false
                }
                await pdfGenerator({ html, res, preview: req.query.preview })
            });
    } else {
        ejs.renderFile(path.join(__dirname, '../../views/order', 'invoice-pdf.ejs'),
            pdfGenerateData,
            async (err: any, html: any) => {
                if (err) {
                    return false
                }
                await pdfGenerator({ html, res, preview: req.query.preview })
            });
    }
    return true
}

export const bulkInvoicePDFExport = async (
    htmlArray: any[],
    order: any,
    basicDetailsSettings: any,
    tax: any,
    currencyCode: string | undefined,
    commonDeliveryDays: string
) => {
    const expectedDeliveryDate = calculateExpectedDeliveryDate(order.orderStatusAt, Number(commonDeliveryDays));
    const invoiceExport = await ejs.renderFile(
        path.join(__dirname, '../../views/order', 'invoice-pdf.ejs'),
        {
            orderDetails: order,
            expectedDeliveryDate,
            TRNNo: basicDetailsSettings?.TRNNo,
            tollFreeNo: basicDetailsSettings?.tollFreeNo,
            storeEmail: basicDetailsSettings?.storeEmail,
            storePhone: basicDetailsSettings?.storePhone,
            storeAppartment: basicDetailsSettings?.storeAppartment,
            storeStreet: basicDetailsSettings?.storeStreet,
            storeCity: basicDetailsSettings?.storeCity,
            storeState: basicDetailsSettings?.storeState,
            storePostalCode: basicDetailsSettings?.storePostalCode,
            shopName: basicDetailsSettings?.shopName || `${process.env.SHOPNAME}`,
            shopLogo: `${process.env.SHOPLOGO}`,
            shop: `${process.env.SHOPNAME}`,
            appUrl: `${process.env.APPURL}`,
            apiAppUrl: `${process.env.APP_API_URL}`,
            tax: tax,
            currencyCode: currencyCode
        }
    );
    htmlArray.push(invoiceExport);

    if (process.env.SHOPNAME === 'Beyondfresh' || process.env.SHOPNAME === 'Smartbaby') {
        const purchaseExport = await ejs.renderFile(path.join(__dirname, '../../views/order', 'purchase-order-invoice.ejs'),
            {
                orderDetails: order,
                expectedDeliveryDate,
                storeEmail: basicDetailsSettings?.storeEmail,
                storePhone: basicDetailsSettings?.storePhone,
                storeAppartment: basicDetailsSettings?.storeAppartment,
                storeStreet: basicDetailsSettings?.storeStreet,
                storeCity: basicDetailsSettings?.storeCity,
                storeState: basicDetailsSettings?.storeState,
                storePostalCode: basicDetailsSettings?.storePostalCode,
                shopName: basicDetailsSettings?.shopName || `${process.env.SHOPNAME}`,
                shopLogo: `${process.env.SHOPLOGO}`,
                shop: `${process.env.SHOPNAME}`,
                appUrl: `${process.env.APPURL}`,
                tax: tax,
                currencyCode: currencyCode
            });
        htmlArray.push(purchaseExport);

        return htmlArray
    }
}

export const orderStatusChangeEmail = async (settingsDetails: any, orderDetails: any, orderStatus: string, updatedOrderDetails: any, tax: any, customerDetails: any) => {
    const defualtSettings = settingsDetails?.find((setting: any) => setting.blockReference === blockReferences.defualtSettings);
    const basicDetailsSettings = settingsDetails?.find((setting: any) => setting.blockReference === blockReferences.basicDetailsSettings)?.blockValues;
    const socialMedia = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.socialMedia)?.blockValues;
    const appUrls = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.appUrls)?.blockValues;

    let commonDeliveryDays = '8';
    if (defualtSettings && defualtSettings.blockValues && defualtSettings.blockValues.commonDeliveryDays) {
        commonDeliveryDays = defualtSettings.blockValues.commonDeliveryDays
    }

    const expectedDeliveryDate = calculateExpectedDeliveryDate(orderDetails.orderStatusAt, Number(commonDeliveryDays))
    ejs.renderFile(path.join(__dirname, '../../views/email/order', orderStatus === orderStatusArrayJson.shipped ? 'order-shipping-email.ejs' : (orderStatus === orderStatusArrayJson.delivered ? 'order-delivered-email.ejs' : 'order-product-status-change.ejs')), {
        firstName: customerDetails?.firstName,
        orderId: orderDetails.orderId,
        totalAmount: orderDetails.totalAmount,
        totalShippingAmount: orderDetails.totalShippingAmount,
        totalProductAmount: orderDetails.totalProductAmount,
        expectedDeliveryDate: expectedDeliveryDate,
        storeEmail: basicDetailsSettings?.storeEmail,
        products: updatedOrderDetails.products,
        shopName: basicDetailsSettings?.shopName || `${process.env.SHOPNAME}`,
        shopLogo: `${process.env.SHOPLOGO}`,
        shopDescription: convert(basicDetailsSettings?.shopDescription, { wordwrap: 130, }),
        appUrl: `${process.env.APPURL}`,
        socialMedia,
        appUrls,
        tax: tax,
        subject: orderStatusMessages[orderStatus],
        content: `Your order ${orderDetails.orderId} has just been cancelled.`,

    }, async (err: any, template: any) => {
        if (err) {
            console.log(err);
            return;
        }
        if (process.env.SHOPNAME === 'Timehouse') {
            await mailChimpEmailGateway({
                subject: orderStatusMessages[orderStatus],
                email: customerDetails?.email,
            }, template)

        } else if (process.env.SHOPNAME === 'Homestyle') {
            const sendEmail = await smtpEmailGateway({
                subject: orderStatusMessages[orderStatus],
                email: customerDetails?.email,
            }, template)

        }
        else if (process.env.SHOPNAME === 'Beyondfresh') {
            const sendEmail = await smtpEmailGateway({
                subject: orderStatusMessages[orderStatus],
                email: customerDetails?.email,
            }, template)
        }
        else if (process.env.SHOPNAME === 'Smartbaby') {
            const sendEmail = await smtpEmailGateway({
                subject: orderStatusMessages[orderStatus],
                email: customerDetails?.email,
            }, template)
            const sendsms = await bulkSmsGateway({ ...customerDetails.toObject(), message: orderStatusMessages[orderStatus] === '4' ? shippingOrder(orderDetails.orderId, expectedDeliveryDate) : (orderStatusMessages[orderStatus] === '5' ? deliveredOrder(orderDetails.orderId) : cancelOrder(orderDetails.orderId)) })
        }
    });
}

export const orderProductStatusChangeEmail = async (settingsDetails: any, orderDetails: any, newStatus: string, customerDetails: any, productDetails: any) => {
    const basicDetailsSettings = settingsDetails?.find((setting: any) => setting.blockReference === blockReferences.basicDetailsSettings)?.blockValues;
    const socialMedia = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.socialMedia)?.blockValues;
    const appUrls = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.appUrls)?.blockValues;

    ejs.renderFile(path.join(__dirname, '../../views/email/order/order-product-status-change.ejs'), {
        firstName: customerDetails?.firstName,
        orderId: orderDetails.orderId,
        content: `Your order for the product "${productDetails[0].productvariants.extraProductTitle !== '' ? productDetails[0].productvariants.extraProductTitle : productDetails[0].productTitle}" has been updated to the status: ${orderProductStatussMessages[newStatus]}.`,
        subject: orderReturnStatusMessages[newStatus],
        storeEmail: basicDetailsSettings?.storeEmail,
        shopName: basicDetailsSettings?.shopName || `${process.env.SHOPNAME}`,
        shopLogo: `${process.env.SHOPLOGO}`,
        shopDescription: convert(basicDetailsSettings?.shopDescription, { wordwrap: 130, }),
        appUrl: `${process.env.APPURL}`,
        socialMedia,
        appUrls,
    }, async (err: any, template: any) => {
        const customerEmail = customerDetails.isGuest ? (customerDetails.guestEmail !== '' ? customerDetails.guestEmail : customerDetails?.email) : customerDetails?.email
        if (err) {
            console.log(err);
            return;
        }
        const emailValues = {
            subject: orderReturnStatusMessages[newStatus],
            email: customerEmail,
            ccmail: [basicDetailsSettings?.storeEmail]
        }
        if (process.env.SHOPNAME === 'Timehouse') {
            await mailChimpEmailGateway(emailValues, template)

        } else if (process.env.SHOPNAME === 'Homestyle') {
            const sendEmail = await smtpEmailGateway(emailValues, template)

        }
        else if (process.env.SHOPNAME === 'Beyondfresh') {
            const sendEmail = await smtpEmailGateway(emailValues, template)
        }
        else if (process.env.SHOPNAME === 'Smartbaby') {
            const sendEmail = await smtpEmailGateway(emailValues, template)
            const sendsms = await bulkSmsGateway({ ...customerDetails.toObject(), message: `Your order for the product "${productDetails[0].productvariants.extraProductTitle !== '' ? productDetails[0].productvariants.extraProductTitle : productDetails[0].productTitle}" has been updated to the status: ${orderProductStatussMessages[newStatus]}.` })
        }
    });
}
export const orderProductCancelStatusChangeEmail = async (settingsDetails: any, orderDetails: any, newStatus: string, customerDetails: any, productDetails: any) => {
    const basicDetailsSettings = settingsDetails?.find((setting: any) => setting.blockReference === blockReferences.basicDetailsSettings)?.blockValues;
    const socialMedia = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.socialMedia)?.blockValues;
    const appUrls = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.appUrls)?.blockValues;

    ejs.renderFile(path.join(__dirname, '../../views/email/order/order-product-status-change.ejs'), {
        firstName: customerDetails?.firstName,
        orderId: orderDetails.orderId,
        content: `Your order for the product "${productDetails[0].productvariants.extraProductTitle !== '' ? productDetails[0].productvariants.extraProductTitle : productDetails[0].productTitle}" has been updated to the status: ${orderProductCancelStatusMessages[newStatus]}.`,
        subject: orderProductCancelStatusMessages[newStatus],
        storeEmail: basicDetailsSettings?.storeEmail,
        shopName: basicDetailsSettings?.shopName || `${process.env.SHOPNAME}`,
        shopLogo: `${process.env.SHOPLOGO}`,
        shopDescription: convert(basicDetailsSettings?.shopDescription, { wordwrap: 130, }),
        appUrl: `${process.env.APPURL}`,
        socialMedia,
        appUrls,
    }, async (err: any, template: any) => {
        const customerEmail = customerDetails.isGuest ? (customerDetails.guestEmail !== '' ? customerDetails.guestEmail : customerDetails?.email) : customerDetails?.email
        if (err) {
            console.log(err);
            return;
        }
        const emailValues = {
            subject: orderProductCancelStatusMessages[newStatus],
            email: customerEmail,
            ccmail: [basicDetailsSettings?.storeEmail]
        }
        if (process.env.SHOPNAME === 'Timehouse') {
            await mailChimpEmailGateway(emailValues, template)

        } else if (process.env.SHOPNAME === 'Homestyle') {
            const sendEmail = await smtpEmailGateway(emailValues, template)

        } else if (process.env.SHOPNAME === 'Beyondfresh') {
            const sendEmail = await smtpEmailGateway(emailValues, template)
        } else if (process.env.SHOPNAME === 'Smartbaby') {
            const sendEmail = await smtpEmailGateway(emailValues, template)
            const sendsms = await bulkSmsGateway({ ...customerDetails.toObject(), message: `Your order for the product "${productDetails[0].productvariants.extraProductTitle !== '' ? productDetails[0].productvariants.extraProductTitle : productDetails[0].productTitle}" has been updated to the status: ${orderProductCancelStatusMessages[newStatus]}.` })
        }
    });
}


export const orderProductReturnStatusChangeEmail = async (settingsDetails: any, orderDetails: any, newStatus: string, customerDetails: any, productDetails: any) => {
    const basicDetailsSettings = settingsDetails?.find((setting: any) => setting.blockReference === blockReferences.basicDetailsSettings)?.blockValues;
    const socialMedia = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.socialMedia)?.blockValues;
    const appUrls = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.appUrls)?.blockValues;

    ejs.renderFile(path.join(__dirname, '../../views/email/order/order-product-status-change.ejs'), {
        firstName: customerDetails?.firstName,
        orderId: orderDetails.orderId,
        content: `Your order for the product "${productDetails[0].productvariants.extraProductTitle !== '' ? productDetails[0].productvariants.extraProductTitle : productDetails[0].productTitle}" has been updated to the status: ${orderReturnStatusMessages[newStatus]}.`,
        subject: orderReturnStatusMessages[newStatus],
        storeEmail: basicDetailsSettings?.storeEmail,
        shopName: basicDetailsSettings?.shopName || `${process.env.SHOPNAME}`,
        shopLogo: `${process.env.SHOPLOGO}`,
        shopDescription: convert(basicDetailsSettings?.shopDescription, { wordwrap: 130, }),
        appUrl: `${process.env.APPURL}`,
        socialMedia,
        appUrls,
    }, async (err: any, template: any) => {
        const customerEmail = customerDetails.isGuest ? (customerDetails.guestEmail !== '' ? customerDetails.guestEmail : customerDetails?.email) : customerDetails?.email
        if (err) {
            console.log(err);
            return;
        }
        const emailValues = {
            subject: orderReturnStatusMessages[newStatus],
            email: customerEmail,
            ccmail: [basicDetailsSettings?.storeEmail]
        }
        if (process.env.SHOPNAME === 'Timehouse') {
            await mailChimpEmailGateway(emailValues, template)

        } else if (process.env.SHOPNAME === 'Homestyle') {
            const sendEmail = await smtpEmailGateway(emailValues, template)
        } else if (process.env.SHOPNAME === 'Beyondfresh') {
            const sendEmail = await smtpEmailGateway(emailValues, template)
        } else if (process.env.SHOPNAME === 'Smartbaby') {
            const sendEmail = await smtpEmailGateway(emailValues, template)
            const sendsms = await bulkSmsGateway({ ...customerDetails.toObject(), message: `Your order for the product "${productDetails[0].productvariants.extraProductTitle !== '' ? productDetails[0].productvariants.extraProductTitle : productDetails[0].productTitle}" has been updated to the status: ${orderReturnStatusMessages[newStatus]}.` })
        }
    });
}

export const orderProductReturnQuantityChangeEmail = async (settingsDetails: any, orderDetails: any, newStatus: string, changedQuantity: number, customerDetails: any, productDetails: any) => {
    const basicDetailsSettings = settingsDetails?.find((setting: any) => setting.blockReference === blockReferences.basicDetailsSettings)?.blockValues;
    const socialMedia = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.socialMedia)?.blockValues;
    const appUrls = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.appUrls)?.blockValues;

    ejs.renderFile(path.join(__dirname, '../../views/email/order/order-product-status-change.ejs'), {
        firstName: customerDetails?.firstName,
        orderId: orderDetails.orderId,
        content: `Your order for the product "${productDetails[0].productvariants.extraProductTitle !== '' ? productDetails[0].productvariants.extraProductTitle : productDetails[0].productTitle}" has been quantity changed to: ${changedQuantity}.`,
        subject: orderReturnStatusMessages[newStatus],
        storeEmail: basicDetailsSettings?.storeEmail,
        shopName: basicDetailsSettings?.shopName || `${process.env.SHOPNAME}`,
        shopLogo: `${process.env.SHOPLOGO}`,
        shopDescription: convert(basicDetailsSettings?.shopDescription, { wordwrap: 130, }),
        appUrl: `${process.env.APPURL}`,
        socialMedia,
        appUrls,
    }, async (err: any, template: any) => {
        const customerEmail = customerDetails.isGuest ? (customerDetails.guestEmail !== '' ? customerDetails.guestEmail : customerDetails?.email) : customerDetails?.email
        if (err) {
            console.log(err);
            return;
        }
        const emailValues = {
            subject: orderReturnStatusMessages[newStatus],
            email: customerEmail,
            ccmail: [basicDetailsSettings?.storeEmail]
        }
        if (process.env.SHOPNAME === 'Timehouse') {
            await mailChimpEmailGateway(emailValues, template)

        } else if (process.env.SHOPNAME === 'Homestyle') {
            const sendEmail = await smtpEmailGateway(emailValues, template)

        } else if (process.env.SHOPNAME === 'Beyondfresh') {
            const sendEmail = await smtpEmailGateway(emailValues, template)
        } else if (process.env.SHOPNAME === 'Smartbaby') {
            const sendEmail = await smtpEmailGateway(emailValues, template)
            const sendsms = await bulkSmsGateway({ ...customerDetails.toObject(), message: `Your order for the product "${productDetails[0].productvariants.extraProductTitle !== '' ? productDetails[0].productvariants.extraProductTitle : productDetails[0].productTitle}" has been quantity changed to: ${changedQuantity}.` })
        }
    });
}
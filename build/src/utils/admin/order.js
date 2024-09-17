"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderProductReturnQuantityChangeEmail = exports.orderProductReturnStatusChangeEmail = exports.orderProductCancelStatusChangeEmail = exports.orderProductStatusChangeEmail = exports.orderStatusChangeEmail = exports.bulkInvoicePDFExport = exports.invoicePdfGenerator = exports.findOrderStatusDateCheck = void 0;
const path_1 = __importDefault(require("path"));
const ejs = require('ejs');
const { convert } = require('html-to-text');
const helpers_1 = require("../helpers");
const website_setup_1 = require("../../constants/website-setup");
const cart_1 = require("../../constants/cart");
const mail_chimp_sms_gateway_1 = require("../../lib/emails/mail-chimp-sms-gateway");
const smtp_nodemailer_gateway_1 = require("../../lib/emails/smtp-nodemailer-gateway");
const pdf_generator_1 = require("../../lib/pdf/pdf-generator");
const bulk_sms_gateway_1 = require("../../lib/sms/bulk-sms-gateway");
const messages_1 = require("../../constants/messages");
const findOrderStatusDateCheck = (orderStatus) => {
    let statusAt;
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
            statusAt = 'orderStatusAt';
            break;
    }
    return statusAt;
};
exports.findOrderStatusDateCheck = findOrderStatusDateCheck;
const invoicePdfGenerator = async (res, req, orderDetails, basicDetailsSettings, tax, expectedDeliveryDate, currencyCode) => {
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
    };
    if (req.query.deliverySlip === '1') {
        ejs.renderFile(path_1.default.join(__dirname, '../../views/order', 'delivery-slip-invoice.ejs'), pdfGenerateData, async (err, html) => {
            if (err) {
                return false;
            }
            await (0, pdf_generator_1.pdfGenerator)({ html, res, preview: req.query.preview });
        });
    }
    else if (req.query.customer === '1') {
        ejs.renderFile(path_1.default.join(__dirname, '../../views/order', 'customer-invoice.ejs'), pdfGenerateData, async (err, html) => {
            if (err) {
                return false;
            }
            await (0, pdf_generator_1.pdfGenerator)({ html, res, preview: req.query.preview });
        });
    }
    else if (req.query.purchaseOrder === '1') {
        ejs.renderFile(path_1.default.join(__dirname, '../../views/order', 'purchase-order-invoice.ejs'), pdfGenerateData, async (err, html) => {
            if (err) {
                return false;
            }
            await (0, pdf_generator_1.pdfGenerator)({ html, res, preview: req.query.preview });
        });
    }
    else {
        ejs.renderFile(path_1.default.join(__dirname, '../../views/order', 'invoice-pdf.ejs'), pdfGenerateData, async (err, html) => {
            if (err) {
                return false;
            }
            await (0, pdf_generator_1.pdfGenerator)({ html, res, preview: req.query.preview });
        });
    }
    return true;
};
exports.invoicePdfGenerator = invoicePdfGenerator;
const bulkInvoicePDFExport = async (htmlArray, order, basicDetailsSettings, tax, currencyCode, commonDeliveryDays) => {
    const expectedDeliveryDate = (0, helpers_1.calculateExpectedDeliveryDate)(order.orderStatusAt, Number(commonDeliveryDays));
    const invoiceExport = await ejs.renderFile(path_1.default.join(__dirname, '../../views/order', 'invoice-pdf.ejs'), {
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
    });
    htmlArray.push(invoiceExport);
    if (process.env.SHOPNAME === 'Beyondfresh' || process.env.SHOPNAME === 'Smartbaby') {
        const purchaseExport = await ejs.renderFile(path_1.default.join(__dirname, '../../views/order', 'purchase-order-invoice.ejs'), {
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
        return htmlArray;
    }
};
exports.bulkInvoicePDFExport = bulkInvoicePDFExport;
const orderStatusChangeEmail = async (settingsDetails, orderDetails, orderStatus, updatedOrderDetails, tax, customerDetails) => {
    const defualtSettings = settingsDetails?.find((setting) => setting.blockReference === website_setup_1.blockReferences.defualtSettings);
    const basicDetailsSettings = settingsDetails?.find((setting) => setting.blockReference === website_setup_1.blockReferences.basicDetailsSettings)?.blockValues;
    const socialMedia = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.socialMedia)?.blockValues;
    const appUrls = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.appUrls)?.blockValues;
    let commonDeliveryDays = '8';
    if (defualtSettings && defualtSettings.blockValues && defualtSettings.blockValues.commonDeliveryDays) {
        commonDeliveryDays = defualtSettings.blockValues.commonDeliveryDays;
    }
    const expectedDeliveryDate = (0, helpers_1.calculateExpectedDeliveryDate)(orderDetails.orderStatusAt, Number(commonDeliveryDays));
    ejs.renderFile(path_1.default.join(__dirname, '../../views/email/order', orderStatus === cart_1.orderStatusArrayJson.shipped ? 'order-shipping-email.ejs' : (orderStatus === cart_1.orderStatusArrayJson.delivered ? 'order-delivered-email.ejs' : 'order-product-status-change.ejs')), {
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
        subject: cart_1.orderStatusMessages[orderStatus],
        content: `Your order ${orderDetails.orderId} has just been cancelled.`,
    }, async (err, template) => {
        if (err) {
            console.log(err);
            return;
        }
        if (process.env.SHOPNAME === 'Timehouse') {
            await (0, mail_chimp_sms_gateway_1.mailChimpEmailGateway)({
                subject: cart_1.orderStatusMessages[orderStatus],
                email: customerDetails?.email,
                ccmail: [basicDetailsSettings?.storeEmail]
            }, template);
        }
        else if (process.env.SHOPNAME === 'Homestyle') {
            const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({
                subject: cart_1.orderStatusMessages[orderStatus],
                email: customerDetails?.email,
                ccmail: [basicDetailsSettings?.storeEmail]
            }, template);
        }
        else if (process.env.SHOPNAME === 'Beyondfresh') {
            const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({
                subject: cart_1.orderStatusMessages[orderStatus],
                email: customerDetails?.email,
                ccmail: [basicDetailsSettings?.storeEmail]
            }, template);
        }
        else if (process.env.SHOPNAME === 'Smartbaby') {
            const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({
                subject: cart_1.orderStatusMessages[orderStatus],
                email: customerDetails?.email,
                ccmail: [basicDetailsSettings?.storeEmail]
            }, template);
            const sendsms = await (0, bulk_sms_gateway_1.bulkSmsGateway)({ ...customerDetails.toObject(), message: cart_1.orderStatusMessages[orderStatus] === '4' ? (0, messages_1.shippingOrder)(orderDetails.orderId, expectedDeliveryDate) : (cart_1.orderStatusMessages[orderStatus] === '5' ? (0, messages_1.deliveredOrder)(orderDetails.orderId) : (0, messages_1.cancelOrder)(orderDetails.orderId)) });
        }
    });
};
exports.orderStatusChangeEmail = orderStatusChangeEmail;
const orderProductStatusChangeEmail = async (settingsDetails, orderDetails, newStatus, customerDetails, productDetails) => {
    const basicDetailsSettings = settingsDetails?.find((setting) => setting.blockReference === website_setup_1.blockReferences.basicDetailsSettings)?.blockValues;
    const socialMedia = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.socialMedia)?.blockValues;
    const appUrls = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.appUrls)?.blockValues;
    ejs.renderFile(path_1.default.join(__dirname, '../../views/email/order/order-product-status-change.ejs'), {
        firstName: customerDetails?.firstName,
        orderId: orderDetails.orderId,
        content: `Your order for the product "${productDetails[0].productvariants.extraProductTitle !== '' ? productDetails[0].productvariants.extraProductTitle : productDetails[0].productTitle}" has been updated to the status: ${cart_1.orderProductStatussMessages[newStatus]}.`,
        subject: cart_1.orderReturnStatusMessages[newStatus],
        storeEmail: basicDetailsSettings?.storeEmail,
        shopName: basicDetailsSettings?.shopName || `${process.env.SHOPNAME}`,
        shopLogo: `${process.env.SHOPLOGO}`,
        shopDescription: convert(basicDetailsSettings?.shopDescription, { wordwrap: 130, }),
        appUrl: `${process.env.APPURL}`,
        socialMedia,
        appUrls,
    }, async (err, template) => {
        const customerEmail = customerDetails.isGuest ? (customerDetails.guestEmail !== '' ? customerDetails.guestEmail : customerDetails?.email) : customerDetails?.email;
        if (err) {
            console.log(err);
            return;
        }
        const emailValues = {
            subject: cart_1.orderReturnStatusMessages[newStatus],
            email: customerEmail,
            ccmail: [basicDetailsSettings?.storeEmail]
        };
        if (process.env.SHOPNAME === 'Timehouse') {
            await (0, mail_chimp_sms_gateway_1.mailChimpEmailGateway)(emailValues, template);
        }
        else if (process.env.SHOPNAME === 'Homestyle') {
            const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)(emailValues, template);
        }
        else if (process.env.SHOPNAME === 'Beyondfresh') {
            const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)(emailValues, template);
        }
        else if (process.env.SHOPNAME === 'Smartbaby') {
            const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)(emailValues, template);
            const sendsms = await (0, bulk_sms_gateway_1.bulkSmsGateway)({ ...customerDetails.toObject(), message: `Your order for the product "${productDetails[0].productvariants.extraProductTitle !== '' ? productDetails[0].productvariants.extraProductTitle : productDetails[0].productTitle}" has been updated to the status: ${cart_1.orderProductStatussMessages[newStatus]}.` });
        }
    });
};
exports.orderProductStatusChangeEmail = orderProductStatusChangeEmail;
const orderProductCancelStatusChangeEmail = async (settingsDetails, orderDetails, newStatus, customerDetails, productDetails) => {
    const basicDetailsSettings = settingsDetails?.find((setting) => setting.blockReference === website_setup_1.blockReferences.basicDetailsSettings)?.blockValues;
    const socialMedia = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.socialMedia)?.blockValues;
    const appUrls = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.appUrls)?.blockValues;
    ejs.renderFile(path_1.default.join(__dirname, '../../views/email/order/order-product-status-change.ejs'), {
        firstName: customerDetails?.firstName,
        orderId: orderDetails.orderId,
        content: `Your order for the product "${productDetails[0].productvariants.extraProductTitle !== '' ? productDetails[0].productvariants.extraProductTitle : productDetails[0].productTitle}" has been updated to the status: ${cart_1.orderProductCancelStatusMessages[newStatus]}.`,
        subject: cart_1.orderProductCancelStatusMessages[newStatus],
        storeEmail: basicDetailsSettings?.storeEmail,
        shopName: basicDetailsSettings?.shopName || `${process.env.SHOPNAME}`,
        shopLogo: `${process.env.SHOPLOGO}`,
        shopDescription: convert(basicDetailsSettings?.shopDescription, { wordwrap: 130, }),
        appUrl: `${process.env.APPURL}`,
        socialMedia,
        appUrls,
    }, async (err, template) => {
        const customerEmail = customerDetails.isGuest ? (customerDetails.guestEmail !== '' ? customerDetails.guestEmail : customerDetails?.email) : customerDetails?.email;
        if (err) {
            console.log(err);
            return;
        }
        const emailValues = {
            subject: cart_1.orderProductCancelStatusMessages[newStatus],
            email: customerEmail,
            ccmail: [basicDetailsSettings?.storeEmail]
        };
        if (process.env.SHOPNAME === 'Timehouse') {
            await (0, mail_chimp_sms_gateway_1.mailChimpEmailGateway)(emailValues, template);
        }
        else if (process.env.SHOPNAME === 'Homestyle') {
            const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)(emailValues, template);
        }
        else if (process.env.SHOPNAME === 'Beyondfresh') {
            const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)(emailValues, template);
        }
        else if (process.env.SHOPNAME === 'Smartbaby') {
            const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)(emailValues, template);
            const sendsms = await (0, bulk_sms_gateway_1.bulkSmsGateway)({ ...customerDetails.toObject(), message: `Your order for the product "${productDetails[0].productvariants.extraProductTitle !== '' ? productDetails[0].productvariants.extraProductTitle : productDetails[0].productTitle}" has been updated to the status: ${cart_1.orderProductCancelStatusMessages[newStatus]}.` });
        }
    });
};
exports.orderProductCancelStatusChangeEmail = orderProductCancelStatusChangeEmail;
const orderProductReturnStatusChangeEmail = async (settingsDetails, orderDetails, newStatus, customerDetails, productDetails) => {
    const basicDetailsSettings = settingsDetails?.find((setting) => setting.blockReference === website_setup_1.blockReferences.basicDetailsSettings)?.blockValues;
    const socialMedia = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.socialMedia)?.blockValues;
    const appUrls = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.appUrls)?.blockValues;
    ejs.renderFile(path_1.default.join(__dirname, '../../views/email/order/order-product-status-change.ejs'), {
        firstName: customerDetails?.firstName,
        orderId: orderDetails.orderId,
        content: `Your order for the product "${productDetails[0].productvariants.extraProductTitle !== '' ? productDetails[0].productvariants.extraProductTitle : productDetails[0].productTitle}" has been updated to the status: ${cart_1.orderReturnStatusMessages[newStatus]}.`,
        subject: cart_1.orderReturnStatusMessages[newStatus],
        storeEmail: basicDetailsSettings?.storeEmail,
        shopName: basicDetailsSettings?.shopName || `${process.env.SHOPNAME}`,
        shopLogo: `${process.env.SHOPLOGO}`,
        shopDescription: convert(basicDetailsSettings?.shopDescription, { wordwrap: 130, }),
        appUrl: `${process.env.APPURL}`,
        socialMedia,
        appUrls,
    }, async (err, template) => {
        const customerEmail = customerDetails.isGuest ? (customerDetails.guestEmail !== '' ? customerDetails.guestEmail : customerDetails?.email) : customerDetails?.email;
        if (err) {
            console.log(err);
            return;
        }
        const emailValues = {
            subject: cart_1.orderReturnStatusMessages[newStatus],
            email: customerEmail,
            ccmail: [basicDetailsSettings?.storeEmail]
        };
        if (process.env.SHOPNAME === 'Timehouse') {
            await (0, mail_chimp_sms_gateway_1.mailChimpEmailGateway)(emailValues, template);
        }
        else if (process.env.SHOPNAME === 'Homestyle') {
            const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)(emailValues, template);
        }
        else if (process.env.SHOPNAME === 'Beyondfresh') {
            const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)(emailValues, template);
        }
        else if (process.env.SHOPNAME === 'Smartbaby') {
            const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)(emailValues, template);
            const sendsms = await (0, bulk_sms_gateway_1.bulkSmsGateway)({ ...customerDetails.toObject(), message: `Your order for the product "${productDetails[0].productvariants.extraProductTitle !== '' ? productDetails[0].productvariants.extraProductTitle : productDetails[0].productTitle}" has been updated to the status: ${cart_1.orderReturnStatusMessages[newStatus]}.` });
        }
    });
};
exports.orderProductReturnStatusChangeEmail = orderProductReturnStatusChangeEmail;
const orderProductReturnQuantityChangeEmail = async (settingsDetails, orderDetails, newStatus, changedQuantity, customerDetails, productDetails) => {
    const basicDetailsSettings = settingsDetails?.find((setting) => setting.blockReference === website_setup_1.blockReferences.basicDetailsSettings)?.blockValues;
    const socialMedia = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.socialMedia)?.blockValues;
    const appUrls = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.appUrls)?.blockValues;
    ejs.renderFile(path_1.default.join(__dirname, '../../views/email/order/order-product-status-change.ejs'), {
        firstName: customerDetails?.firstName,
        orderId: orderDetails.orderId,
        content: `Your order for the product "${productDetails[0].productvariants.extraProductTitle !== '' ? productDetails[0].productvariants.extraProductTitle : productDetails[0].productTitle}" has been quantity changed to: ${changedQuantity}.`,
        subject: cart_1.orderReturnStatusMessages[newStatus],
        storeEmail: basicDetailsSettings?.storeEmail,
        shopName: basicDetailsSettings?.shopName || `${process.env.SHOPNAME}`,
        shopLogo: `${process.env.SHOPLOGO}`,
        shopDescription: convert(basicDetailsSettings?.shopDescription, { wordwrap: 130, }),
        appUrl: `${process.env.APPURL}`,
        socialMedia,
        appUrls,
    }, async (err, template) => {
        const customerEmail = customerDetails.isGuest ? (customerDetails.guestEmail !== '' ? customerDetails.guestEmail : customerDetails?.email) : customerDetails?.email;
        if (err) {
            console.log(err);
            return;
        }
        const emailValues = {
            subject: cart_1.orderReturnStatusMessages[newStatus],
            email: customerEmail,
            ccmail: [basicDetailsSettings?.storeEmail]
        };
        if (process.env.SHOPNAME === 'Timehouse') {
            await (0, mail_chimp_sms_gateway_1.mailChimpEmailGateway)(emailValues, template);
        }
        else if (process.env.SHOPNAME === 'Homestyle') {
            const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)(emailValues, template);
        }
        else if (process.env.SHOPNAME === 'Beyondfresh') {
            const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)(emailValues, template);
        }
        else if (process.env.SHOPNAME === 'Smartbaby') {
            const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)(emailValues, template);
            const sendsms = await (0, bulk_sms_gateway_1.bulkSmsGateway)({ ...customerDetails.toObject(), message: `Your order for the product "${productDetails[0].productvariants.extraProductTitle !== '' ? productDetails[0].productvariants.extraProductTitle : productDetails[0].productTitle}" has been quantity changed to: ${changedQuantity}.` });
        }
    });
};
exports.orderProductReturnQuantityChangeEmail = orderProductReturnQuantityChangeEmail;

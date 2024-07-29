"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const path_1 = __importDefault(require("path"));
const ejs = require('ejs');
const { convert } = require('html-to-text');
const helpers_1 = require("../../../utils/helpers");
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const order_service_1 = __importDefault(require("../../../services/admin/order/order-service"));
const mongoose_1 = __importDefault(require("mongoose"));
const cart_order_model_1 = __importDefault(require("../../../model/frontend/cart-order-model"));
const cart_1 = require("../../../constants/cart");
const customer_wallet_transaction_model_1 = __importDefault(require("../../../model/frontend/customer-wallet-transaction-model"));
const settings_service_1 = __importDefault(require("../../../services/admin/setup/settings-service"));
const website_setup_1 = require("../../../constants/website-setup");
const wallet_1 = require("../../../constants/wallet");
const customer_service_1 = __importDefault(require("../../../services/frontend/customer-service"));
const mail_chimp_sms_gateway_1 = require("../../../lib/emails/mail-chimp-sms-gateway");
const website_setup_model_1 = __importDefault(require("../../../model/admin/setup/website-setup-model"));
const cart_order_product_model_1 = __importDefault(require("../../../model/frontend/cart-order-product-model"));
const pdf_generator_1 = require("../../../lib/pdf/pdf-generator");
const tax_model_1 = __importDefault(require("../../../model/admin/setup/tax-model"));
const product_variants_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-variants-model"));
const smtp_nodemailer_gateway_1 = require("../../../lib/emails/smtp-nodemailer-gateway");
const country_model_1 = __importDefault(require("../../../model/admin/setup/country-model"));
const controller = new base_controller_1.default();
class OrdersController extends base_controller_1.default {
    async findAll(req, res) {
        try {
            const { page_size = 1, limit = 10, cartStatus = '', sortby = '', sortorder = '', keyword = '', countryId = '', customerId = '', pickupStoreId = '', paymentMethodId = '', couponId = '', orderFromDate, orderEndDate, processingFromDate, processingEndDate, packedFromDate, packedEndDate, shippedFromDate, shippedEndDate, deliveredFromDate, deliveredEndDate, canceledFromDate, canceledEndDate, returnedFromDate, returnedEndDate, refundedFromDate, refundedEndDate, partiallyShippedFromDate, partiallyShippedEndDate, onHoldFromDate, onHoldEndDate, failedFromDate, failedEndDate, completedFromDate, completedEndDate, pickupFromDate, pickupEndDate, cartFromDate, cartEndDate } = req.query;
            let query = { _id: { $exists: true } };
            const userData = await res.locals.user;
            const country = (0, helpers_1.getCountryId)(userData);
            if (country) {
                query.countryId = country;
            }
            else if (countryId) {
                query.countryId = new mongoose_1.default.Types.ObjectId(countryId);
            }
            query = { cartStatus: { $ne: "1" } };
            // { customerId: customerDetails._id },
            // { countryId: countryData._id },
            if (customerId) {
                query = {
                    ...query, customerId: new mongoose_1.default.Types.ObjectId(customerId)
                };
            }
            if (cartStatus) {
                query = {
                    ...query, cartStatus: cartStatus
                };
            }
            if (couponId) {
                query = {
                    ...query, couponId: new mongoose_1.default.Types.ObjectId(couponId)
                };
            }
            if (paymentMethodId) {
                query = {
                    ...query, paymentMethodId: new mongoose_1.default.Types.ObjectId(paymentMethodId)
                };
            }
            if (pickupStoreId) {
                query = {
                    ...query, pickupStoreId: new mongoose_1.default.Types.ObjectId(pickupStoreId)
                };
            }
            if (orderFromDate || orderEndDate) {
                query.orderStatusAt = {
                    ...(orderFromDate && { $gte: new Date(orderFromDate) }),
                    ...(orderEndDate && { $lte: (0, helpers_1.dateConvertPm)(orderEndDate) })
                };
            }
            if (processingFromDate || processingEndDate) {
                query.processingStatusAt = {
                    ...(processingFromDate && { $gte: new Date(processingFromDate) }),
                    ...(processingEndDate && { $lte: (0, helpers_1.dateConvertPm)(processingEndDate) })
                };
            }
            if (packedFromDate || packedEndDate) {
                query.packedStatusAt = {
                    ...(packedFromDate && { $gte: new Date(packedFromDate) }),
                    ...(packedEndDate && { $lte: (0, helpers_1.dateConvertPm)(packedEndDate) })
                };
            }
            if (shippedFromDate || shippedEndDate) {
                query.shippedStatusAt = {
                    ...(shippedFromDate && { $gte: new Date(shippedFromDate) }),
                    ...(shippedEndDate && { $lte: (0, helpers_1.dateConvertPm)(shippedEndDate) })
                };
            }
            if (deliveredFromDate || deliveredEndDate) {
                query.deliveredStatusAt = {
                    ...(deliveredFromDate && { $gte: new Date(deliveredFromDate) }),
                    ...(deliveredEndDate && { $lte: (0, helpers_1.dateConvertPm)(deliveredEndDate) })
                };
            }
            if (canceledFromDate || canceledEndDate) {
                query.canceledStatusAt = {
                    ...(canceledFromDate && { $gte: new Date(canceledFromDate) }),
                    ...(canceledEndDate && { $lte: (0, helpers_1.dateConvertPm)(canceledEndDate) })
                };
            }
            if (returnedFromDate || returnedEndDate) {
                query.returnedStatusAt = {
                    ...(returnedFromDate && { $gte: new Date(returnedFromDate) }),
                    ...(returnedEndDate && { $lte: (0, helpers_1.dateConvertPm)(returnedEndDate) })
                };
            }
            if (refundedFromDate || refundedEndDate) {
                query.refundedStatusAt = {
                    ...(refundedFromDate && { $gte: new Date(refundedFromDate) }),
                    ...(refundedEndDate && { $lte: (0, helpers_1.dateConvertPm)(refundedEndDate) })
                };
            }
            if (partiallyShippedFromDate || partiallyShippedEndDate) {
                query.partiallyShippedStatusAt = {
                    ...(partiallyShippedFromDate && { $gte: new Date(partiallyShippedFromDate) }),
                    ...(partiallyShippedEndDate && { $lte: (0, helpers_1.dateConvertPm)(partiallyShippedEndDate) })
                };
            }
            if (onHoldFromDate || onHoldEndDate) {
                query.onHoldStatusAt = {
                    ...(onHoldFromDate && { $gte: new Date(onHoldFromDate) }),
                    ...(onHoldEndDate && { $lte: (0, helpers_1.dateConvertPm)(onHoldEndDate) })
                };
            }
            if (failedFromDate || failedEndDate) {
                query.failedStatusAt = {
                    ...(failedFromDate && { $gte: new Date(failedFromDate) }),
                    ...(failedEndDate && { $lte: (0, helpers_1.dateConvertPm)(failedEndDate) })
                };
            }
            if (completedFromDate || completedEndDate) {
                query.completedStatusAt = {
                    ...(completedFromDate && { $gte: new Date(completedFromDate) }),
                    ...(completedEndDate && { $lte: (0, helpers_1.dateConvertPm)(completedEndDate) })
                };
            }
            if (pickupFromDate || pickupEndDate) {
                query.pickupStatusAt = {
                    ...(pickupFromDate && { $gte: new Date(pickupFromDate) }),
                    ...(pickupEndDate && { $lte: (0, helpers_1.dateConvertPm)(pickupEndDate) })
                };
            }
            if (cartFromDate || cartEndDate) {
                query.cartStatusAt = {
                    ...(cartFromDate && { $gte: new Date(cartFromDate) }),
                    ...(cartEndDate && { $lte: (0, helpers_1.dateConvertPm)(cartEndDate) })
                };
            }
            const sort = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const order = await order_service_1.default.OrderList({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort
            });
            const totalCount = await order_service_1.default.OrderList({
                page: parseInt(page_size),
                query,
                getTotalCount: true
            });
            return controller.sendSuccessResponse(res, {
                requestedData: order,
                totalCount: totalCount.length,
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching coupons' });
        }
    }
    async getOrderDetails(req, res) {
        try {
            const orderId = req.params.id;
            const orderDetails = await order_service_1.default.OrderList({
                query: {
                    _id: new mongoose_1.default.Types.ObjectId(orderId)
                },
                getAddress: '1',
                getCartProducts: '1',
                hostName: req.get('origin'),
            });
            if (orderDetails && orderDetails?.length > 0) {
                return controller.sendSuccessResponse(res, {
                    requestedData: orderDetails[0],
                    message: 'Your Order is ready!'
                });
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Order not fount'
                });
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Order not fount'
            });
        }
    }
    async orderStatusChange(req, res) {
        try {
            const orderId = req.params.id;
            const orderStatus = req.body.orderStatus;
            const isValidStatus = cart_1.orderStatusArray.some(status => status.value === orderStatus);
            if (!isValidStatus) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Invalid order status'
                });
            }
            const orderDetails = await cart_order_model_1.default.findById(orderId);
            if (!orderDetails) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Order not fount'
                });
            }
            // Ensure that the order cannot go back to a previous status once delivered
            if (orderDetails.orderStatus === '5' && ["1", "2", "3", "4", "9", "10", "13"].includes(orderStatus)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Cannot change the status back to a previous state once delivered'
                });
            }
            // Ensure that the order cannot be changed to Canceled after Delivered
            if (orderDetails.orderStatus === '5' && orderStatus === '6') {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Cannot change the status to Canceled once delivered'
                });
            }
            // Ensure that Returned status is only possible after Delivered
            if (orderStatus === '7' && orderDetails.orderStatus !== '5') {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Returned status is only possible after Delivered'
                });
            }
            if (orderStatus === '8' && orderDetails.orderStatus !== '7') {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Refunded status is only possible after Returned'
                });
            }
            if (orderStatus === '12' && orderDetails.orderStatus !== '5') {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Completed status is only possible after Delivered'
                });
            }
            // Ensure that the order cannot be changed from Completed to any other status
            if (orderDetails.orderStatus === '12') {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Cannot change the status once it is completed'
                });
            }
            if (orderDetails.orderStatus === '11') {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Cannot change the status once it is failed'
                });
            }
            if (orderDetails.orderStatus === '8') {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Cannot change the status once it is refunded'
                });
            }
            let customerDetails = null;
            if (!orderDetails?.isGuest && orderDetails.customerId) {
                const walletTransactionDetails = await customer_wallet_transaction_model_1.default.findOne({ orderId: orderDetails._id });
                customerDetails = await customer_service_1.default.findOne({ _id: orderDetails?.customerId });
                if (customerDetails) {
                    if (orderStatus === '5' && !walletTransactionDetails) {
                        const walletsDetails = await settings_service_1.default.findOne({ countryId: orderDetails.countryId, block: website_setup_1.websiteSetup.basicSettings, blockReference: website_setup_1.blockReferences.wallets });
                        if ((walletsDetails) && (walletsDetails.blockValues) && (walletsDetails.blockValues.enableWallet) && (Number(walletsDetails.blockValues.orderAmount) > 0) && (orderDetails?.totalAmount >= Number(walletsDetails.blockValues.minimumOrderAmount))) {
                            const rewarDetails = (0, helpers_1.calculateWalletRewardPoints)(walletsDetails.blockValues, orderDetails.totalAmount);
                            await customer_wallet_transaction_model_1.default.create({
                                customerId: orderDetails.customerId,
                                orderId: orderDetails._id,
                                earnType: wallet_1.earnTypes.order,
                                walletAmount: rewarDetails.redeemableAmount,
                                walletPoints: rewarDetails.rewardPoints,
                                status: '1'
                            });
                            if (customerDetails) {
                                await customer_service_1.default.update(customerDetails?._id, {
                                    totalRewardPoint: (customerDetails.totalRewardPoint + rewarDetails.rewardPoints),
                                    totalWalletAmount: (customerDetails.totalWalletAmount + rewarDetails.redeemableAmount)
                                });
                            }
                            orderDetails.rewardAmount = rewarDetails.redeemableAmount;
                            orderDetails.rewardPoints = rewarDetails.rewardPoints;
                        }
                    }
                    else if ((orderStatus === '8' || orderStatus === '6') && walletTransactionDetails) {
                        await customer_wallet_transaction_model_1.default.findByIdAndUpdate(walletTransactionDetails._id, {
                            earnType: orderStatus === '8' ? wallet_1.earnTypes.orderReturned : wallet_1.earnTypes.orderCancelled,
                            status: '3' // rejected
                        });
                        await customer_service_1.default.update(customerDetails?._id, {
                            totalRewardPoint: (customerDetails.totalRewardPoint - walletTransactionDetails.walletPoints),
                            totalWalletAmount: (customerDetails.totalWalletAmount - walletTransactionDetails.walletAmount)
                        });
                        orderDetails.rewardAmount = 0;
                        orderDetails.rewardPoints = 0;
                    }
                }
            }
            orderDetails.orderStatus = orderStatus;
            if (orderStatus === '12' || orderStatus === '5') {
                orderDetails.cartStatus == cart_1.cartStatus.delivered;
            }
            const currentDate = new Date();
            switch (orderStatus) {
                case '1':
                    orderDetails.orderStatusAt = currentDate;
                    break;
                case '2':
                    orderDetails.processingStatusAt = currentDate;
                    break;
                case '3':
                    orderDetails.packedStatusAt = currentDate;
                    break;
                case '4':
                    orderDetails.shippedStatusAt = currentDate;
                    break;
                case '5':
                    orderDetails.deliveredStatusAt = currentDate;
                    break;
                case '6':
                    orderDetails.canceledStatusAt = currentDate;
                    break;
                case '7':
                    orderDetails.returnedStatusAt = currentDate;
                    break;
                case '8':
                    orderDetails.refundedStatusAt = currentDate;
                    break;
                case '9':
                    orderDetails.partiallyShippedStatusAt = currentDate;
                    break;
                case '10':
                    orderDetails.onHoldStatusAt = currentDate;
                    break;
                case '11':
                    orderDetails.failedStatusAt = currentDate;
                    break;
                case '12':
                    orderDetails.completedStatusAt = currentDate;
                    break;
                case '13':
                    orderDetails.pickupStatusAt = currentDate;
                    break;
                default: break;
            }
            const updatedOrderDetails = await order_service_1.default.orderStatusUpdate(orderDetails._id, orderDetails, '1');
            if (!updatedOrderDetails) {
                return controller.sendErrorResponse(res, 500, {
                    message: 'Something went wrong!'
                });
            }
            await cart_order_product_model_1.default.updateMany({ cartId: orderDetails._id }, {
                $set: {
                    orderStatus: orderStatus,
                    orderStatusAt: currentDate
                }
            });
            if (orderStatus === '11' || orderStatus === '7') { // return products
                const cartProducts = await cart_order_product_model_1.default.find({ cartId: orderDetails._id }).select('variantId quantity');
                const updateProductVariant = cartProducts.map((products) => ({
                    updateOne: {
                        filter: { _id: products.variantId },
                        update: { $inc: { quantity: products.quantity } },
                    }
                }));
                await product_variants_model_1.default.bulkWrite(updateProductVariant);
            }
            if (orderStatus === '4' || orderStatus === '5') {
                let query = { _id: { $exists: true } };
                query = {
                    ...query,
                    countryId: orderDetails.countryId,
                    block: website_setup_1.websiteSetup.basicSettings,
                    blockReference: { $in: [website_setup_1.blockReferences.defualtSettings, website_setup_1.blockReferences.basicDetailsSettings, website_setup_1.blockReferences.socialMedia, website_setup_1.blockReferences.appUrls] },
                    status: '1',
                };
                const settingsDetails = await website_setup_model_1.default.find(query);
                const defualtSettings = settingsDetails?.find((setting) => setting.blockReference === website_setup_1.blockReferences.defualtSettings);
                const basicDetailsSettings = settingsDetails?.find((setting) => setting.blockReference === website_setup_1.blockReferences.basicDetailsSettings)?.blockValues;
                const socialMedia = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.socialMedia)?.blockValues;
                const appUrls = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.appUrls)?.blockValues;
                const options = {
                    wordwrap: 130,
                    // ...
                };
                let commonDeliveryDays = '8';
                if (defualtSettings && defualtSettings.blockValues && defualtSettings.blockValues.commonDeliveryDays) {
                    commonDeliveryDays = defualtSettings.blockValues.commonDeliveryDays;
                }
                const tax = await tax_model_1.default.findOne({ countryId: orderDetails.countryId, status: "1" });
                const expectedDeliveryDate = (0, helpers_1.calculateExpectedDeliveryDate)(orderDetails.orderStatusAt, Number(commonDeliveryDays));
                ejs.renderFile(path_1.default.join(__dirname, '../../../views/email/order', orderStatus === '4' ? 'order-shipping-email.ejs' : 'order-delivered-email.ejs'), {
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
                    shopDescription: convert(basicDetailsSettings?.shopDescription, options),
                    appUrl: `${process.env.APPURL}`,
                    socialMedia,
                    appUrls,
                    tax: tax
                }, async (err, template) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    if (process.env.SHOPNAME === 'Timehouse') {
                        await (0, mail_chimp_sms_gateway_1.mailChimpEmailGateway)({
                            subject: cart_1.orderStatusMessages[orderStatus],
                            email: customerDetails?.email,
                        }, template);
                    }
                    else if (process.env.SHOPNAME === 'Homestyle') {
                        const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({
                            subject: cart_1.orderStatusMessages[orderStatus],
                            email: customerDetails?.email,
                        }, template);
                    }
                    else if (process.env.SHOPNAME === 'Beyondfresh') {
                        const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({
                            subject: cart_1.orderStatusMessages[orderStatus],
                            email: customerDetails?.email,
                        }, template);
                    }
                    else if (process.env.SHOPNAME === 'Smartbaby') {
                        const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({
                            subject: cart_1.orderStatusMessages[orderStatus],
                            email: customerDetails?.email,
                        }, template);
                    }
                });
            }
            // console.log('aaaaaaaa', updatedOrderDetails);
            return controller.sendSuccessResponse(res, {
                requestedData: updatedOrderDetails,
                message: cart_1.orderStatusMessages[orderStatus] || 'Order status updated successfully!'
            });
        }
        catch (error) {
            console.log('error', error);
            return controller.sendErrorResponse(res, 500, {
                message: 'Order not fount'
            });
        }
    }
    async getInvoice(req, res) {
        try {
            const orderId = req.params.id;
            const orderDetails = await order_service_1.default.OrderList({
                query: {
                    _id: new mongoose_1.default.Types.ObjectId(orderId)
                },
                getAddress: '1',
                getCartProducts: '1',
                hostName: req.get('origin'),
            });
            if (orderDetails && orderDetails.length > 0) {
                let websiteSettingsQuery = { _id: { $exists: true } };
                websiteSettingsQuery = {
                    ...websiteSettingsQuery,
                    countryId: orderDetails[0].country._id,
                    block: website_setup_1.websiteSetup.basicSettings,
                    blockReference: { $in: [website_setup_1.blockReferences.defualtSettings, website_setup_1.blockReferences.basicDetailsSettings, website_setup_1.blockReferences.socialMedia] },
                    status: '1',
                };
                const settingsDetails = await website_setup_model_1.default.find(websiteSettingsQuery);
                if (!settingsDetails) {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Settings details not fount'
                    });
                }
                const defualtSettings = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.defualtSettings);
                const basicDetailsSettings = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.basicDetailsSettings)?.blockValues;
                if (!basicDetailsSettings) {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Basic details settings not fount'
                    });
                }
                let commonDeliveryDays = '6';
                if (defualtSettings && defualtSettings.blockValues && defualtSettings.blockValues.commonDeliveryDays) {
                    commonDeliveryDays = defualtSettings.blockValues.commonDeliveryDays;
                }
                const tax = await tax_model_1.default.findOne({ countryId: orderDetails[0].country._id, status: "1" });
                const currencyCode = await country_model_1.default.findOne({ _id: orderDetails[0].country._id }, 'currencyCode');
                const expectedDeliveryDate = (0, helpers_1.calculateExpectedDeliveryDate)(orderDetails[0].orderStatusAt, Number(commonDeliveryDays));
                ejs.renderFile(path_1.default.join(__dirname, '../../../views/order', 'invoice-pdf.ejs'), {
                    orderDetails: orderDetails[0],
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
                    appUrl: `${process.env.APPURL}`,
                    tax: tax,
                    currencyCode: currencyCode?.currencyCode
                }, async (err, html) => {
                    if (err) {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Error generating invoice'
                        });
                    }
                    await (0, pdf_generator_1.pdfGenerator)({ html, res });
                });
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Order not fount'
                });
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Error generating invoice'
            });
        }
    }
}
exports.default = new OrdersController();

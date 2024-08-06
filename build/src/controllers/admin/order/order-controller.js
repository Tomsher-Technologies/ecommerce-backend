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
const website_setup_1 = require("../../../constants/website-setup");
const customer_service_1 = __importDefault(require("../../../services/frontend/customer-service"));
const mail_chimp_sms_gateway_1 = require("../../../lib/emails/mail-chimp-sms-gateway");
const website_setup_model_1 = __importDefault(require("../../../model/admin/setup/website-setup-model"));
const cart_order_product_model_1 = __importDefault(require("../../../model/frontend/cart-order-product-model"));
const pdf_generator_1 = require("../../../lib/pdf/pdf-generator");
const tax_model_1 = __importDefault(require("../../../model/admin/setup/tax-model"));
const product_variants_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-variants-model"));
const smtp_nodemailer_gateway_1 = require("../../../lib/emails/smtp-nodemailer-gateway");
const country_model_1 = __importDefault(require("../../../model/admin/setup/country-model"));
const customers_model_1 = __importDefault(require("../../../model/frontend/customers-model"));
const product_config_1 = require("../../../utils/config/product-config");
const product_model_1 = __importDefault(require("../../../model/admin/ecommerce/product-model"));
const reports_1 = require("../../../utils/admin/excel/reports");
const controller = new base_controller_1.default();
class OrdersController extends base_controller_1.default {
    async findAll(req, res) {
        try {
            const { page_size = 1, limit = 10, cartStatus = '', sortby = '', sortorder = '', keyword = '', countryId = '', customerId = '', pickupStoreId = '', paymentMethodId = '', couponId = '', orderFromDate, orderEndDate, processingFromDate, processingEndDate, packedFromDate, packedEndDate, shippedFromDate, shippedEndDate, deliveredFromDate, deliveredEndDate, canceledFromDate, canceledEndDate, returnedFromDate, returnedEndDate, refundedFromDate, refundedEndDate, partiallyShippedFromDate, partiallyShippedEndDate, onHoldFromDate, onHoldEndDate, failedFromDate, failedEndDate, completedFromDate, completedEndDate, pickupFromDate, pickupEndDate, cartFromDate, cartEndDate, isExcel } = req.query;
            let query = { _id: { $exists: true } };
            const userData = await res.locals.user;
            const country = (0, helpers_1.getCountryId)(userData);
            query = { cartStatus: { $ne: cart_1.cartStatus.active } };
            if (country) {
                query.countryId = country;
            }
            else if (countryId) {
                query.countryId = new mongoose_1.default.Types.ObjectId(countryId);
            }
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
            if (isExcel !== '1') {
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
            else {
                const orders = await order_service_1.default.orderListExcelExport({
                    page: parseInt(page_size),
                    limit: parseInt(limit),
                    query,
                    sort
                });
                if (orders && orders.length > 0) {
                    await (0, reports_1.exportOrderReport)(res, orders);
                }
                else {
                    return controller.sendErrorResponse(res, 200, { message: 'Order Data not found' });
                }
            }
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
    async getOrdeReturnProducts(req, res) {
        const { page_size = 1, limit = 10, sortby = '', sortorder = '', countryId = '', customerId = '', paymentMethodId = '', orderProductReturnStatus = '', orderProductReturnStatusFromDate = '', orderProductReturnStatusEndDate = '' } = req.query;
        const userData = await res.locals.user;
        let query = {
            _id: { $exists: true },
            'cartDetails.orderStatus': cart_1.orderProductStatusJson.delivered,
            'cartDetails.cartStatus': { $ne: cart_1.cartStatus.active },
            $or: [
                { orderRequestedProductQuantity: { $gt: 0 } },
                { orderRequestedProductQuantityStatus: { $ne: "0" } },
                { orderProductReturnStatus: { $ne: "0" } },
            ]
        };
        const country = (0, helpers_1.getCountryId)(userData);
        if (country) {
            query['cartDetails.countryId'] = country;
        }
        else if (countryId) {
            query['cartDetails.countryId'] = new mongoose_1.default.Types.ObjectId(countryId);
        }
        if (customerId) {
            query['cartDetails.customerId'] = new mongoose_1.default.Types.ObjectId(customerId);
        }
        if (paymentMethodId) {
            query['cartDetails.paymentMethodId'] = new mongoose_1.default.Types.ObjectId(paymentMethodId);
        }
        if (orderProductReturnStatus) {
            query = {
                ...query, orderProductReturnStatus: orderProductReturnStatus
            };
        }
        if (orderProductReturnStatusFromDate || orderProductReturnStatusEndDate) {
            query.orderProductReturnStatusStatusAt = {
                ...(orderProductReturnStatusFromDate && { $gte: new Date(orderProductReturnStatusFromDate) }),
                ...(orderProductReturnStatusEndDate && { $lte: (0, helpers_1.dateConvertPm)(orderProductReturnStatusEndDate) })
            };
        }
        const sort = {};
        if (sortby && sortorder) {
            sort[sortby] = sortorder === 'desc' ? -1 : 1;
        }
        const order = await order_service_1.default.getOrdeReturnProducts({
            page: parseInt(page_size),
            limit: parseInt(limit),
            query,
            sort,
            getTotalCount: false
        });
        const totalCount = await order_service_1.default.getOrdeReturnProducts({
            page: parseInt(page_size),
            query,
            getTotalCount: true
        });
        return controller.sendSuccessResponse(res, {
            requestedData: order,
            totalCount: totalCount?.totalCount || 0,
            message: 'Success!'
        }, 200);
    }
    async orderProductStatusChange(req, res) {
        const { orderID, orderProductId } = req.params;
        const { newStatus } = req.body;
        const orderProducts = await cart_order_product_model_1.default.find({ cartId: new mongoose_1.default.Types.ObjectId(orderID) });
        if (orderProducts.length === 0) {
            return controller.sendErrorResponse(res, 200, { message: 'Order not found!' });
        }
        if (orderProducts.length === 1) {
            return controller.sendErrorResponse(res, 200, { message: 'Please update the status through the main order status!' });
        }
        const orderProduct = orderProducts.find(product => product._id.toString() === orderProductId);
        if (!orderProduct) {
            return controller.sendErrorResponse(res, 200, { message: 'Order product not found!' });
        }
        const invalidStatuses = [cart_1.orderProductStatusJson.returned, cart_1.orderProductStatusJson.refunded, cart_1.orderProductStatusJson.canceled, cart_1.orderProductStatusJson.delivered];
        if (invalidStatuses.includes(orderProduct.orderProductStatus)) {
            return controller.sendErrorResponse(res, 200, { message: 'Status change not allowed for the current product status.' });
        }
        if (Number(orderProduct.orderProductStatus) > Number(cart_1.orderProductStatusJson.delivered)) {
            return controller.sendErrorResponse(res, 200, { message: 'Status can only be changed to a value before "Delivered".' });
        }
        const orderDetails = await cart_order_model_1.default.findById(orderProduct.cartId);
        if (!orderDetails) {
            return controller.sendErrorResponse(res, 200, { message: 'Order not found!' });
        }
        if (Number(orderDetails.orderStatus) > Number(cart_1.orderStatusArrayJason.delivered)) {
            return controller.sendErrorResponse(res, 200, { message: 'Cannot change status for an order with status before "Delivered".' });
        }
        if (!newStatus || !Object.values(cart_1.orderProductStatusJson).includes(newStatus)) {
            return controller.sendErrorResponse(res, 200, { message: 'Invalid status provided.' });
        }
        const updateProductStatus = {
            orderProductStatus: newStatus,
            orderProductStatusAt: new Date()
        };
        const updatedProduct = await cart_order_product_model_1.default.findByIdAndUpdate(orderProduct._id, updateProductStatus, { new: true });
        if (!updatedProduct) {
            return controller.sendErrorResponse(res, 200, { message: 'Failed to update product status. Please try again later.' });
        }
        const updateOrderStatus = {};
        if (orderProduct.orderProductStatus === cart_1.orderProductStatusJson.delivered) {
            const otherProductsDelivered = orderProducts.filter(product => product._id.toString() !== orderProductId).every(product => product.orderProductStatus === cart_1.orderProductStatusJson.delivered);
            if (otherProductsDelivered) {
                updateOrderStatus.orderStatus = cart_1.orderStatusArrayJason.delivered;
                updateOrderStatus.deliveredStatusAt = new Date();
            }
            else {
                updateOrderStatus.orderStatus = cart_1.orderStatusArrayJason.partiallyDelivered;
                updateOrderStatus.partiallyDeliveredStatusAt = new Date();
            }
        }
        else if (orderProduct.orderProductStatus === cart_1.orderProductStatusJson.shipped) {
            const otherProductsShipped = orderProducts.filter(product => product._id.toString() !== orderProductId).every(product => product.orderProductStatus === cart_1.orderProductStatusJson.shipped);
            if (otherProductsShipped) {
                updateOrderStatus.orderStatus = cart_1.orderStatusArrayJason.shipped;
                updateOrderStatus.shippedStatusAt = new Date();
            }
            else {
                updateOrderStatus.orderStatus = cart_1.orderStatusArrayJason.partiallyShipped;
                updateOrderStatus.partiallyShippedStatusAt = new Date();
            }
        }
        if (Object.keys(updateOrderStatus).length > 0) {
            await cart_order_model_1.default.findByIdAndUpdate(orderProduct.cartId, updateOrderStatus);
        }
        if (newStatus === cart_1.orderProductStatusJson.delivered || newStatus === cart_1.orderProductStatusJson.shipped) {
            const productDetails = await product_model_1.default.aggregate((0, product_config_1.productDetailsWithVariant)({ 'productvariants._id': orderProduct.variantId }));
            if (productDetails && productDetails?.length > 0) {
                const customerDetails = await customers_model_1.default.findOne({ _id: orderDetails.customerId });
                if (customerDetails) {
                    let query = { _id: { $exists: true } };
                    query = {
                        ...query,
                        countryId: orderDetails.countryId,
                        block: website_setup_1.websiteSetup.basicSettings,
                        blockReference: { $in: [website_setup_1.blockReferences.defualtSettings, website_setup_1.blockReferences.basicDetailsSettings, website_setup_1.blockReferences.socialMedia, website_setup_1.blockReferences.appUrls] },
                        status: '1',
                    };
                    const settingsDetails = await website_setup_model_1.default.find(query);
                    const basicDetailsSettings = settingsDetails?.find((setting) => setting.blockReference === website_setup_1.blockReferences.basicDetailsSettings)?.blockValues;
                    const socialMedia = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.socialMedia)?.blockValues;
                    const appUrls = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.appUrls)?.blockValues;
                    ejs.renderFile(path_1.default.join(__dirname, '../../../views/email/order/order-product-status-change.ejs'), {
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
                        if (process.env.SHOPNAME === 'Timehouse') {
                            await (0, mail_chimp_sms_gateway_1.mailChimpEmailGateway)({
                                subject: cart_1.orderReturnStatusMessages[newStatus],
                                email: customerEmail
                            }, template);
                        }
                        else if (process.env.SHOPNAME === 'Homestyle') {
                            const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({
                                subject: cart_1.orderReturnStatusMessages[newStatus],
                                email: customerEmail,
                            }, template);
                        }
                        else if (process.env.SHOPNAME === 'Beyondfresh') {
                            const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({
                                subject: cart_1.orderReturnStatusMessages[newStatus],
                                email: customerEmail,
                            }, template);
                        }
                        else if (process.env.SHOPNAME === 'Smartbaby') {
                            const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({
                                subject: cart_1.orderReturnStatusMessages[newStatus],
                                email: customerEmail,
                            }, template);
                        }
                    });
                }
            }
        }
        const updatedOrderDetails = await order_service_1.default.OrderList({
            query: {
                _id: orderProduct.cartId
            },
            getAddress: '1',
            getCartProducts: '1',
            hostName: req.get('origin'),
        });
        if (updatedOrderDetails && updatedOrderDetails?.length > 0) {
            return controller.sendSuccessResponse(res, {
                requestedData: updatedOrderDetails[0],
                message: cart_1.orderProductStatussMessages[newStatus]
            });
        }
        else {
            return controller.sendErrorResponse(res, 200, {
                message: 'Order not fount'
            });
        }
    }
    async orderProductReturnStatusChange(req, res) {
        try {
            const orderProductId = req.params.id;
            const orderProductDetails = await cart_order_product_model_1.default.findOne({ _id: new mongoose_1.default.Types.ObjectId(orderProductId) });
            if (!orderProductDetails) {
                return controller.sendErrorResponse(res, 200, { message: 'Your order product not found!' });
            }
            if (orderProductDetails.orderProductStatus !== cart_1.orderProductStatusJson.delivered) {
                return controller.sendErrorResponse(res, 200, { message: `You cant change to this status without delivered product` });
            }
            if (orderProductDetails.quantity < orderProductDetails.orderRequestedProductQuantity) {
                return controller.sendErrorResponse(res, 200, { message: `You cant change quantity out of ${orderProductDetails.quantity}` });
            }
            const orderDetails = await cart_order_model_1.default.findOne({ _id: orderProductDetails.cartId });
            if (!orderDetails) {
                return controller.sendErrorResponse(res, 200, { message: 'Your order not found!' });
            }
            const { quantityChange, newStatus } = req.body;
            if (!newStatus) {
                return controller.sendErrorResponse(res, 200, { message: 'Invalid order return status!' });
            }
            const currentStatus = quantityChange ? orderProductDetails.orderRequestedProductQuantityStatus : orderProductDetails.orderProductReturnStatus;
            const statusJson = quantityChange ? cart_1.orderProductReturnQuantityStatusJson : cart_1.orderProductReturnStatusJson;
            if (currentStatus === statusJson.refunded) {
                return controller.sendErrorResponse(res, 200, { message: 'No further status changes are allowed once the product is refunded.' });
            }
            if (!newStatus) {
                return controller.sendErrorResponse(res, 200, { message: 'Invalid order return status!' });
            }
            if (currentStatus === newStatus) {
                return controller.sendErrorResponse(res, 200, { message: 'This status has already been applied. Please choose a different status.' });
            }
            if (newStatus === statusJson.received && currentStatus !== statusJson.approved) {
                return controller.sendErrorResponse(res, 200, { message: 'The item must be approved before it can be received.' });
            }
            if (newStatus === statusJson.refunded && currentStatus !== statusJson.received) {
                return controller.sendErrorResponse(res, 200, { message: 'The item can only be refunded after it has been received.' });
            }
            let updateVariantProductQuantity = null;
            let orderUpdateFields = {};
            const orderProductUpdateFields = {
                [quantityChange ? 'orderRequestedProductQuantityStatus' : 'orderProductReturnStatus']: newStatus,
                [quantityChange ? 'orderRequestedProductQuantityStatusAt' : 'orderProductReturnStatusAt']: new Date(),
            };
            if (newStatus === statusJson.approved) {
                orderProductUpdateFields[quantityChange ? 'orderProductReturnQuantityApprovedStatusAt' : 'orderProductReturnApprovedStatusAt'] = new Date();
            }
            else if (newStatus === statusJson.refunded) {
                orderProductUpdateFields[quantityChange ? 'orderProductReturnQuantityRefundStatusAt' : 'orderProductReturnRefundStatusAt'] = new Date();
                const newQuantity = orderProductDetails.orderRequestedProductQuantity;
                const perUnitPrice = orderProductDetails.productAmount / orderProductDetails.quantity;
                orderProductUpdateFields['returnedProductAmount'] = quantityChange ? ((orderProductDetails.quantity - newQuantity) * perUnitPrice) : orderProductDetails.productAmount;
                orderUpdateFields['totalReturnedProductAmount'] = quantityChange ? (orderDetails?.totalReturnedProductAmount || 0) + ((orderProductDetails.quantity - newQuantity) * perUnitPrice) : (orderDetails?.totalReturnedProductAmount || 0) + orderProductDetails.productAmount;
                orderProductUpdateFields['orderProductStatus'] = cart_1.orderProductStatusJson.canceled;
            }
            else if (newStatus === statusJson.received) {
                orderProductUpdateFields[quantityChange ? 'orderProductReturnQuantityReceivedStatusAt' : 'orderProductReturnReceivedStatusAt'] = new Date();
                if (!quantityChange) {
                    updateVariantProductQuantity = orderProductDetails.quantity;
                }
                else {
                    updateVariantProductQuantity = orderProductDetails.orderRequestedProductQuantity;
                }
            }
            else if (newStatus === statusJson.rejected) {
                orderProductUpdateFields[quantityChange ? 'orderProductReturnQuantityRejectedStatusAt' : 'orderProductReturnRejectedStatusAt'] = new Date();
            }
            const updatedOrderProductDetails = await cart_order_product_model_1.default.findByIdAndUpdate(orderProductDetails._id, orderProductUpdateFields);
            if (!updatedOrderProductDetails) {
                return controller.sendErrorResponse(res, 200, { message: 'Something went wrong please try again.' });
            }
            if (orderUpdateFields && orderUpdateFields?.totalReturnedProductAmount) {
                await cart_order_model_1.default.findOneAndUpdate(orderDetails._id, orderUpdateFields);
            }
            if (newStatus === statusJson.approved || newStatus === statusJson.rejected || newStatus === statusJson.refunded || newStatus === statusJson.received) {
                const productDetails = await product_model_1.default.aggregate((0, product_config_1.productDetailsWithVariant)({ 'productvariants._id': orderProductDetails.variantId }));
                if (newStatus === statusJson.received && updateVariantProductQuantity) {
                    await product_variants_model_1.default.findOneAndUpdate(orderProductDetails.variantId, { quantity: (productDetails[0].productvariants.quantity + (orderProductDetails.quantity - updateVariantProductQuantity)) });
                }
                if (productDetails && productDetails?.length > 0) {
                    const customerDetails = await customers_model_1.default.findOne({ _id: orderDetails.customerId });
                    if (customerDetails) {
                        let query = { _id: { $exists: true } };
                        query = {
                            ...query,
                            countryId: orderDetails.countryId,
                            block: website_setup_1.websiteSetup.basicSettings,
                            blockReference: { $in: [website_setup_1.blockReferences.defualtSettings, website_setup_1.blockReferences.basicDetailsSettings, website_setup_1.blockReferences.socialMedia, website_setup_1.blockReferences.appUrls] },
                            status: '1',
                        };
                        const settingsDetails = await website_setup_model_1.default.find(query);
                        const basicDetailsSettings = settingsDetails?.find((setting) => setting.blockReference === website_setup_1.blockReferences.basicDetailsSettings)?.blockValues;
                        const socialMedia = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.socialMedia)?.blockValues;
                        const appUrls = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.appUrls)?.blockValues;
                        ejs.renderFile(path_1.default.join(__dirname, '../../../views/email/order/order-product-status-change.ejs'), {
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
                            if (process.env.SHOPNAME === 'Timehouse') {
                                await (0, mail_chimp_sms_gateway_1.mailChimpEmailGateway)({
                                    subject: cart_1.orderReturnStatusMessages[newStatus],
                                    email: customerEmail
                                }, template);
                            }
                            else if (process.env.SHOPNAME === 'Homestyle') {
                                const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({
                                    subject: cart_1.orderReturnStatusMessages[newStatus],
                                    email: customerEmail,
                                }, template);
                            }
                            else if (process.env.SHOPNAME === 'Beyondfresh') {
                                const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({
                                    subject: cart_1.orderReturnStatusMessages[newStatus],
                                    email: customerEmail,
                                }, template);
                            }
                            else if (process.env.SHOPNAME === 'Smartbaby') {
                                const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({
                                    subject: cart_1.orderReturnStatusMessages[newStatus],
                                    email: customerEmail,
                                }, template);
                            }
                        });
                    }
                }
            }
            const updatedOrderDetails = await order_service_1.default.OrderList({
                query: {
                    _id: orderProductDetails.cartId
                },
                getAddress: '1',
                getCartProducts: '1',
                hostName: req.get('origin'),
            });
            if (updatedOrderDetails && updatedOrderDetails?.length > 0) {
                return controller.sendSuccessResponse(res, {
                    requestedData: updatedOrderDetails[0],
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
            console.log('error', error);
            return controller.sendErrorResponse(res, 500, {
                message: 'Order not fount'
            });
        }
    }
    async orderProductReturnQuantityChange(req, res) {
        try {
            const orderProductId = req.params.id;
            const { changedQuantity, newStatus } = req.body;
            const orderProductDetails = await cart_order_product_model_1.default.findOne({ _id: new mongoose_1.default.Types.ObjectId(orderProductId) });
            if (!orderProductDetails) {
                return controller.sendErrorResponse(res, 200, { message: 'Your order product not found!' });
            }
            if (orderProductDetails.orderProductStatus !== cart_1.orderProductStatusJson.pending) {
                return controller.sendErrorResponse(res, 200, { message: `You cant change to this status without pending product` });
            }
            if (changedQuantity >= orderProductDetails.quantity) {
                return controller.sendErrorResponse(res, 200, { message: `Changed quantity cannot be greater than or equal to the original quantity` });
            }
            const orderDetails = await cart_order_model_1.default.findOne({ _id: orderProductDetails.cartId });
            if (!orderDetails) {
                return controller.sendErrorResponse(res, 200, { message: 'Your order not found!' });
            }
            let orderUpdateFields = {};
            const orderProductUpdateFields = {
                ['changedQuantity']: changedQuantity,
                ['changedQuantityStatusAt']: new Date(),
            };
            const perUnitPrice = orderProductDetails.productAmount / orderProductDetails.quantity;
            orderProductUpdateFields['returnedProductAmount'] = ((orderProductDetails.quantity - changedQuantity) * perUnitPrice);
            orderUpdateFields['totalReturnedProductAmount'] = (orderDetails?.totalReturnedProductAmount || 0) + (orderProductUpdateFields['returnedProductAmount'] || 0);
            const updatedOrderProductDetails = await cart_order_product_model_1.default.findByIdAndUpdate(orderProductDetails._id, orderProductUpdateFields);
            if (!updatedOrderProductDetails) {
                return controller.sendErrorResponse(res, 200, { message: 'Something went wrong please try again.' });
            }
            if (orderUpdateFields && orderUpdateFields?.totalReturnedProductAmount) {
                await cart_order_model_1.default.findOneAndUpdate(orderDetails._id, orderUpdateFields);
            }
            const productDetails = await product_model_1.default.aggregate((0, product_config_1.productDetailsWithVariant)({ 'productvariants._id': orderProductDetails.variantId }));
            if (productDetails && productDetails?.length > 0) {
                if (orderProductDetails.changedQuantity === 0) {
                    await product_variants_model_1.default.findOneAndUpdate(orderProductDetails.variantId, { quantity: (((productDetails[0].productvariants.quantity) + (orderProductDetails.quantity - changedQuantity))) });
                }
                const customerDetails = await customers_model_1.default.findOne({ _id: orderDetails.customerId });
                if (customerDetails) {
                    let query = { _id: { $exists: true } };
                    query = {
                        ...query,
                        countryId: orderDetails.countryId,
                        block: website_setup_1.websiteSetup.basicSettings,
                        blockReference: { $in: [website_setup_1.blockReferences.defualtSettings, website_setup_1.blockReferences.basicDetailsSettings, website_setup_1.blockReferences.socialMedia, website_setup_1.blockReferences.appUrls] },
                        status: '1',
                    };
                    const settingsDetails = await website_setup_model_1.default.find(query);
                    const basicDetailsSettings = settingsDetails?.find((setting) => setting.blockReference === website_setup_1.blockReferences.basicDetailsSettings)?.blockValues;
                    const socialMedia = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.socialMedia)?.blockValues;
                    const appUrls = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.appUrls)?.blockValues;
                    ejs.renderFile(path_1.default.join(__dirname, '../../../views/email/order/order-product-status-change.ejs'), {
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
                        if (process.env.SHOPNAME === 'Timehouse') {
                            await (0, mail_chimp_sms_gateway_1.mailChimpEmailGateway)({
                                subject: cart_1.orderReturnStatusMessages[newStatus],
                                email: customerEmail
                            }, template);
                        }
                        else if (process.env.SHOPNAME === 'Homestyle') {
                            const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({
                                subject: cart_1.orderReturnStatusMessages[newStatus],
                                email: customerEmail,
                            }, template);
                        }
                        else if (process.env.SHOPNAME === 'Beyondfresh') {
                            const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({
                                subject: cart_1.orderReturnStatusMessages[newStatus],
                                email: customerEmail,
                            }, template);
                        }
                        else if (process.env.SHOPNAME === 'Smartbaby') {
                            const sendEmail = await (0, smtp_nodemailer_gateway_1.smtpEmailGateway)({
                                subject: cart_1.orderReturnStatusMessages[newStatus],
                                email: customerEmail,
                            }, template);
                        }
                    });
                }
            }
            const updatedOrderDetails = await order_service_1.default.OrderList({
                query: {
                    _id: orderProductDetails.cartId
                },
                getAddress: '1',
                getCartProducts: '1',
                hostName: req.get('origin'),
            });
            if (updatedOrderDetails && updatedOrderDetails?.length > 0) {
                return controller.sendSuccessResponse(res, {
                    requestedData: updatedOrderDetails[0],
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
            return controller.sendErrorResponse(res, 500, {
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
            if (orderDetails.orderStatus === cart_1.orderStatusArrayJason.delivered && [
                cart_1.orderStatusArrayJason.pending,
                cart_1.orderStatusArrayJason.processing,
                cart_1.orderStatusArrayJason.packed,
                cart_1.orderStatusArrayJason.shipped,
                cart_1.orderStatusArrayJason.partiallyShipped,
                cart_1.orderStatusArrayJason.onHold,
                cart_1.orderStatusArrayJason.pickup
            ].includes(orderStatus)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Cannot change the status back to a previous state once delivered'
                });
            }
            // Ensure that the order cannot be changed to Canceled after Delivered
            if (orderDetails.orderStatus === cart_1.orderStatusArrayJason.delivered && orderStatus === cart_1.orderStatusArrayJason.canceled) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Cannot change the status to Canceled once delivered'
                });
            }
            // Ensure that Returned status is only possible after Delivered
            if (orderStatus === cart_1.orderStatusArrayJason.returned && orderDetails.orderStatus !== cart_1.orderStatusArrayJason.delivered) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Returned status is only possible after Delivered'
                });
            }
            // Ensure that Refunded status is only possible after Returned
            if (orderStatus === cart_1.orderStatusArrayJason.refunded && orderDetails.orderStatus !== cart_1.orderStatusArrayJason.returned) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Refunded status is only possible after Returned'
                });
            }
            // Ensure that Completed status is only possible after Delivered
            if (orderStatus === cart_1.orderStatusArrayJason.completed && orderDetails.orderStatus !== cart_1.orderStatusArrayJason.delivered) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Completed status is only possible after Delivered'
                });
            }
            // Ensure that the order cannot be changed from Completed to any other status
            if (orderDetails.orderStatus === cart_1.orderStatusArrayJason.completed) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Cannot change the status once it is completed'
                });
            }
            // Ensure that the order cannot be changed from Failed
            if (orderDetails.orderStatus === cart_1.orderStatusArrayJason.failed) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Cannot change the status once it is failed'
                });
            }
            // Ensure that the order cannot be changed from Refunded
            if (orderDetails.orderStatus === cart_1.orderStatusArrayJason.refunded) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Cannot change the status once it is refunded'
                });
            }
            let customerDetails = null;
            if (orderDetails.customerId) {
                customerDetails = await customer_service_1.default.findOne({ _id: orderDetails?.customerId });
                if (orderStatus === cart_1.orderStatusArrayJason.completed && customerDetails) {
                    await order_service_1.default.orderWalletAmountTransactions(orderStatus, orderDetails, customerDetails);
                }
            }
            orderDetails.orderStatus = orderStatus;
            // Update cart status if the order status is Completed or Delivered
            if (orderStatus === cart_1.orderStatusArrayJason.completed || orderStatus === cart_1.orderStatusArrayJason.delivered) {
                orderDetails.cartStatus = cart_1.cartStatus.delivered;
            }
            const currentDate = new Date();
            switch (orderStatus) {
                case cart_1.orderStatusArrayJason.pending:
                    orderDetails.orderStatusAt = currentDate;
                    break;
                case cart_1.orderStatusArrayJason.processing:
                    orderDetails.processingStatusAt = currentDate;
                    break;
                case cart_1.orderStatusArrayJason.packed:
                    orderDetails.packedStatusAt = currentDate;
                    break;
                case cart_1.orderStatusArrayJason.shipped:
                    orderDetails.shippedStatusAt = currentDate;
                    break;
                case cart_1.orderStatusArrayJason.delivered:
                    orderDetails.deliveredStatusAt = currentDate;
                    break;
                case cart_1.orderStatusArrayJason.canceled:
                    orderDetails.canceledStatusAt = currentDate;
                    break;
                case cart_1.orderStatusArrayJason.returned:
                    orderDetails.returnedStatusAt = currentDate;
                    break;
                case cart_1.orderStatusArrayJason.refunded:
                    orderDetails.refundedStatusAt = currentDate;
                    break;
                case cart_1.orderStatusArrayJason.partiallyShipped:
                    orderDetails.partiallyShippedStatusAt = currentDate;
                    break;
                case cart_1.orderStatusArrayJason.onHold:
                    orderDetails.onHoldStatusAt = currentDate;
                    break;
                case cart_1.orderStatusArrayJason.failed:
                    orderDetails.failedStatusAt = currentDate;
                    break;
                case cart_1.orderStatusArrayJason.completed:
                    orderDetails.completedStatusAt = currentDate;
                    break;
                case cart_1.orderStatusArrayJason.pickup:
                    orderDetails.pickupStatusAt = currentDate;
                    break;
                case cart_1.orderStatusArrayJason.partiallyDelivered:
                    orderDetails.partiallyDeliveredStatusAt = currentDate;
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
                    orderProductStatus: orderStatus,
                    orderProductStatusAt: currentDate
                }
            });
            if (orderStatus === cart_1.orderStatusArrayJason.failed || orderStatus === cart_1.orderStatusArrayJason.returned) {
                const cartProducts = await cart_order_product_model_1.default.find({ cartId: orderDetails._id }).select('variantId quantity');
                const updateProductVariant = cartProducts.map((products) => ({
                    updateOne: {
                        filter: { _id: products.variantId },
                        update: { $inc: { quantity: products.quantity } },
                    }
                }));
                await product_variants_model_1.default.bulkWrite(updateProductVariant);
            }
            if (orderStatus === cart_1.orderStatusArrayJason.shipped || orderStatus === cart_1.orderStatusArrayJason.delivered) {
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
                    shopDescription: convert(basicDetailsSettings?.shopDescription, { wordwrap: 130, }),
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
                message: 'Something went wrong'
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

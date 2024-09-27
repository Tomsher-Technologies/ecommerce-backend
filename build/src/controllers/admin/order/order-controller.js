"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const mongoose_1 = __importDefault(require("mongoose"));
const helpers_1 = require("../../../utils/helpers");
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const order_service_1 = __importDefault(require("../../../services/admin/order/order-service"));
const product_config_1 = require("../../../utils/config/product-config");
const reports_1 = require("../../../utils/admin/excel/reports");
const order_1 = require("../../../utils/admin/order");
const cart_1 = require("../../../constants/cart");
const website_setup_1 = require("../../../constants/website-setup");
const task_log_1 = require("../../../constants/admin/task-log");
const pdf_generator_1 = require("../../../lib/pdf/pdf-generator");
const customer_service_1 = __importDefault(require("../../../services/frontend/customer-service"));
const website_setup_model_1 = __importDefault(require("../../../model/admin/setup/website-setup-model"));
const cart_order_model_1 = __importDefault(require("../../../model/frontend/cart-order-model"));
const cart_order_product_model_1 = __importDefault(require("../../../model/frontend/cart-order-product-model"));
const tax_model_1 = __importDefault(require("../../../model/admin/setup/tax-model"));
const product_variants_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-variants-model"));
const country_model_1 = __importDefault(require("../../../model/admin/setup/country-model"));
const customers_model_1 = __importDefault(require("../../../model/frontend/customers-model"));
const product_model_1 = __importDefault(require("../../../model/admin/ecommerce/product-model"));
const collections_1 = require("../../../constants/collections");
const controller = new base_controller_1.default();
class OrdersController extends base_controller_1.default {
    async findAll(req, res) {
        try {
            const { page_size = 1, limit = 10, cartStatus = '', sortby = '', sortorder = '', keyword = '', countryId = '', customerId = '', pickupStoreId = '', paymentMethodId = '', couponId = '', cityId = '', stateId = '', fromDate, endDate, isExcel, isPdfExport, orderStatus = '', deliveryType } = req.query;
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
            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = {
                    $or: [
                        { orderId: keywordRegex },
                        { 'country.countryShortTitle': keywordRegex },
                        { 'country.countryTitle': keywordRegex },
                        { 'customer.firstName': keywordRegex },
                        { 'customer.email': keywordRegex },
                        { 'paymentMethod.paymentMethodTitle': keywordRegex },
                    ],
                    ...query
                };
            }
            if (customerId) {
                query = {
                    ...query, customerId: new mongoose_1.default.Types.ObjectId(customerId)
                };
            }
            if (orderStatus) {
                query = {
                    ...query, orderStatus: orderStatus
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
            if (deliveryType === cart_1.deliveryTypesJson.shipping) {
                query = {
                    ...query, pickupStoreId: null
                };
            }
            if (deliveryType === cart_1.deliveryTypesJson.pickupFromSrore) {
                query = {
                    ...query, pickupStoreId: { $ne: null }
                };
            }
            if (stateId) {
                query = {
                    ...query, stateId: new mongoose_1.default.Types.ObjectId(stateId)
                };
            }
            if (cityId) {
                query = {
                    ...query, cityId: new mongoose_1.default.Types.ObjectId(cityId)
                };
            }
            if (fromDate || endDate) {
                const dateFilter = {};
                if (fromDate)
                    dateFilter.$gte = new Date(fromDate);
                if (endDate)
                    dateFilter.$lte = (0, helpers_1.dateConvertPm)(endDate);
                if (orderStatus) {
                    const statusField = (0, order_1.findOrderStatusDateCheck)(cart_1.orderStatusMap[orderStatus].value);
                    query[statusField] = { ...dateFilter };
                }
            }
            const sort = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            if (isExcel !== '1') {
                const orders = await order_service_1.default.OrderList({
                    page: parseInt(page_size),
                    limit: parseInt(limit),
                    query,
                    sort,
                    getCartProducts: '1',
                    getAddress: '1',
                    hostName: req.get('origin'),
                });
                if (orders.length > 0 && isPdfExport == '1') {
                    let websiteSettingsQuery = { _id: { $exists: true } };
                    websiteSettingsQuery = {
                        ...websiteSettingsQuery,
                        countryId: orders[0].country._id,
                        block: website_setup_1.websiteSetup.basicSettings,
                        blockReference: { $in: [website_setup_1.blockReferences.defualtSettings, website_setup_1.blockReferences.basicDetailsSettings, website_setup_1.blockReferences.socialMedia] },
                        status: '1',
                    };
                    const settingsDetails = await website_setup_model_1.default.find(websiteSettingsQuery);
                    if (!settingsDetails) {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Settings details not found'
                        });
                    }
                    const defualtSettings = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.defualtSettings);
                    const basicDetailsSettings = settingsDetails?.find((setting) => setting?.blockReference === website_setup_1.blockReferences.basicDetailsSettings)?.blockValues;
                    if (!basicDetailsSettings) {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Basic details settings not found'
                        });
                    }
                    let commonDeliveryDays = '6';
                    if (defualtSettings && defualtSettings.blockValues && defualtSettings.blockValues.commonDeliveryDays) {
                        commonDeliveryDays = defualtSettings.blockValues.commonDeliveryDays;
                    }
                    const htmlArray = [];
                    for (const order of orders) {
                        const tax = await tax_model_1.default.findOne({ countryId: order.country._id, status: "1" });
                        const currencyCode = await country_model_1.default.findOne({ _id: order.country._id }, 'currencyCode');
                        await (0, order_1.bulkInvoicePDFExport)(htmlArray, order, basicDetailsSettings, tax, currencyCode?.currencyCode, commonDeliveryDays);
                    }
                    await (0, pdf_generator_1.pdfGenerator)({
                        html: htmlArray,
                        res,
                        preview: req.query.preview || '0',
                        bulkExport: true
                    });
                }
                else {
                    const totalCount = await order_service_1.default.OrderList({
                        page: parseInt(page_size),
                        query,
                        getTotalCount: true
                    });
                    return controller.sendSuccessResponse(res, {
                        requestedData: orders,
                        totalCount: totalCount.length,
                        message: 'Success!'
                    }, 200);
                }
            }
            else {
                const orderData = await order_service_1.default.orderListExcelExport({
                    page: parseInt(page_size),
                    limit: parseInt(limit),
                    query,
                    sort
                });
                if (orderData.orders && orderData.orders.length > 0) {
                    await (0, reports_1.exportOrderReport)(res, orderData.orders, orderData);
                }
                else {
                    return controller.sendErrorResponse(res, 200, { message: 'Order Data not found' });
                }
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching order' });
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
            // 'cartDetails.orderStatus': orderProductStatusJson.delivered,
            'cartDetails.cartStatus': { $ne: cart_1.cartStatus.active },
            $or: [
                { orderRequestedProductQuantity: { $exists: true, $gt: 0 } },
                { orderRequestedProductQuantityStatus: { $exists: true, $ne: "0" } },
                { orderProductReturnStatus: { $exists: true, $ne: "0" } },
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
        // if (Number(orderDetails.orderStatus) > Number(orderStatusArrayJson.delivered)) {
        //     return controller.sendErrorResponse(res, 200, { message: 'Cannot change status for an order with status before "Delivered".' });
        // }
        if (!newStatus || !Object.values(cart_1.orderProductStatusJson).includes(newStatus)) {
            return controller.sendErrorResponse(res, 200, { message: 'Invalid status provided.' });
        }
        if ((Number(orderProduct.orderProductStatus) < Number(cart_1.orderProductStatusJson.delivered)) && (newStatus === cart_1.orderProductStatusJson.returned || newStatus === cart_1.orderProductStatusJson.refunded)) {
            return controller.sendErrorResponse(res, 200, { message: 'Status can only be changed to a value after "Delivered"' });
        }
        let updateProductStatus = {
            orderProductStatus: newStatus,
            orderProductStatusAt: new Date()
        };
        const updateOrderStatus = {};
        if (newStatus === cart_1.orderProductStatusJson.canceled) {
            if (orderProduct.orderProductStatus !== cart_1.orderProductStatusJson.pending) {
                return controller.sendErrorResponse(res, 200, { message: 'Pending products only to change cancelled status.' });
            }
            else {
                updateProductStatus = {
                    ...updateProductStatus,
                    orderRequestedProductCancelStatus: cart_1.orderProductCancelStatusJson.pending,
                    orderRequestedProductCancelStatusAt: new Date()
                };
            }
        }
        else if (newStatus === cart_1.orderProductStatusJson.returned) {
            updateProductStatus = {
                ...updateProductStatus,
                orderProductReturnStatus: cart_1.orderProductReturnStatusJson.pending,
                orderProductReturnStatusAt: new Date()
            };
        }
        else if (newStatus === cart_1.orderProductStatusJson.refunded) {
            updateOrderStatus.totalReturnedProductAmount = ((orderDetails.totalReturnedProductAmount + orderProduct.productAmount) || 0);
            updateProductStatus = {
                ...updateProductStatus,
                returnedProductAmount: orderProduct.productAmount,
                ...(orderProduct.orderProductStatus === cart_1.orderProductStatusJson.canceled ? {
                    orderRequestedProductCancelStatus: cart_1.orderProductCancelStatusJson.refunded,
                    orderRequestedProductCancelStatusAt: new Date()
                } : {})
            };
        }
        const updatedProduct = await cart_order_product_model_1.default.findByIdAndUpdate(orderProduct._id, updateProductStatus, { new: true });
        if (!updatedProduct) {
            return controller.sendErrorResponse(res, 200, { message: 'Failed to update product status. Please try again later.' });
        }
        if (orderProducts.length > 1) {
            const allProductsInOrder = await cart_order_product_model_1.default.find({ cartId: updatedProduct.cartId });
            if (updatedProduct.orderProductStatus === cart_1.orderProductStatusJson.delivered) {
                const otherProductsDelivered = allProductsInOrder.filter((product) => product._id.toString() !== orderProductId).every((product) => product.orderProductStatus === cart_1.orderProductStatusJson.delivered);
                if (otherProductsDelivered) {
                    updateOrderStatus.orderStatus = cart_1.orderStatusArrayJson.delivered;
                    updateOrderStatus.deliveredStatusAt = new Date();
                }
                else {
                    updateOrderStatus.orderStatus = cart_1.orderStatusArrayJson.partiallyDelivered;
                    updateOrderStatus.partiallyDeliveredStatusAt = new Date();
                }
            }
            else if (updatedProduct.orderProductStatus === cart_1.orderProductStatusJson.shipped) {
                const otherProductsShipped = allProductsInOrder.filter((product) => product._id.toString() !== orderProductId).every((product) => product.orderProductStatus === cart_1.orderProductStatusJson.shipped);
                if (otherProductsShipped) {
                    updateOrderStatus.orderStatus = cart_1.orderStatusArrayJson.shipped;
                    updateOrderStatus.shippedStatusAt = new Date();
                }
                else {
                    updateOrderStatus.orderStatus = cart_1.orderStatusArrayJson.partiallyShipped;
                    updateOrderStatus.partiallyShippedStatusAt = new Date();
                }
            }
            else if (updatedProduct.orderProductStatus === cart_1.orderProductStatusJson.canceled) {
                await product_variants_model_1.default.findByIdAndUpdate(orderProduct.variantId, { $inc: { quantity: orderProduct.quantity } }, { new: true, useFindAndModify: false });
                const otherProductsCanceled = allProductsInOrder.filter((product) => product._id.toString() !== orderProductId).every((product) => product.orderProductStatus === cart_1.orderProductStatusJson.canceled);
                if (otherProductsCanceled) {
                    updateOrderStatus.orderStatus = cart_1.orderStatusArrayJson.canceled;
                    updateOrderStatus.canceledStatusAt = new Date();
                }
                else {
                    updateOrderStatus.orderStatus = cart_1.orderStatusArrayJson.partiallyCanceled;
                    updateOrderStatus.partiallyCanceledStatusAt = new Date();
                }
            }
            else if (updatedProduct.orderProductStatus === cart_1.orderProductStatusJson.returned) {
                const otherProductsReturned = allProductsInOrder.filter((product) => product._id.toString() !== orderProductId).every((product) => product.orderProductStatus === cart_1.orderProductStatusJson.returned);
                if (otherProductsReturned) {
                    updateOrderStatus.orderStatus = cart_1.orderStatusArrayJson.returned;
                    updateOrderStatus.returnedStatusAt = new Date();
                }
                else {
                    updateOrderStatus.orderStatus = cart_1.orderStatusArrayJson.partiallyReturned;
                    updateOrderStatus.partiallyReturnedStatusAt = new Date();
                }
            }
            else if (updatedProduct.orderProductStatus === cart_1.orderProductStatusJson.refunded) {
                const otherProductsRefunded = allProductsInOrder.filter((product) => product._id.toString() !== orderProductId).every((product) => product.orderProductStatus === cart_1.orderProductStatusJson.refunded);
                if (otherProductsRefunded) {
                    updateOrderStatus.orderStatus = cart_1.orderStatusArrayJson.refunded;
                    updateOrderStatus.refundedStatusAt = new Date();
                }
                else {
                    updateOrderStatus.orderStatus = cart_1.orderStatusArrayJson.partiallyRefunded;
                    updateOrderStatus.partiallyRefundedStatusAt = new Date();
                }
            }
            if (Object.keys(updateOrderStatus).length > 0) {
                await cart_order_model_1.default.findByIdAndUpdate(orderProduct.cartId, updateOrderStatus);
            }
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
                    await (0, order_1.orderProductStatusChangeEmail)(settingsDetails, orderDetails, newStatus, customerDetails, productDetails);
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
            const user = res.locals.user;
            return controller.sendSuccessResponse(res, {
                requestedData: updatedOrderDetails[0],
                message: cart_1.orderProductStatussMessages[newStatus]
            }, 200, {
                userId: user._id,
                countryId: user.countryId,
                sourceCollection: collections_1.collections.cart.cartorders,
                referenceData: JSON.stringify({
                    orderId: orderDetails.orderId,
                    orderCode: orderDetails.orderCode,
                    allValues: updatedOrderDetails[0]
                }, null, 2),
                sourceFromId: orderID,
                sourceFromReferenceId: orderProductId,
                sourceFrom: task_log_1.adminTaskLog.orders.order,
                activityComment: `Order product status changed to: ${cart_1.orderReturnStatusMessages[newStatus]}`,
                activity: task_log_1.adminTaskLogActivity.update,
                activityStatus: task_log_1.adminTaskLogStatus.success
            });
        }
        else {
            return controller.sendErrorResponse(res, 200, {
                message: 'Order not fount'
            });
        }
    }
    async orderProductCancelStatusChange(req, res) {
        try {
            const orderProductId = req.params.orderProductId;
            const orderProductDetails = await cart_order_product_model_1.default.findOne({ _id: new mongoose_1.default.Types.ObjectId(orderProductId) });
            const { newStatus } = req.body;
            if (!orderProductDetails) {
                return controller.sendErrorResponse(res, 200, { message: 'Your order product not found!' });
            }
            if (orderProductDetails.orderProductStatus === cart_1.orderProductCancelStatusJson.refunded) {
                return controller.sendErrorResponse(res, 200, { message: `This product allready refunded` });
            }
            if (orderProductDetails.orderProductStatus !== cart_1.orderProductStatusJson.canceled) {
                return controller.sendErrorResponse(res, 200, { message: 'The product must be canceled before it can be refunded.' });
            }
            if (orderProductDetails.orderRequestedProductCancelStatus !== cart_1.orderProductCancelStatusJson.pending) {
                return controller.sendErrorResponse(res, 200, { message: 'You cannot change to this status without canceling the pending status.' });
            }
            const orderDetails = await cart_order_model_1.default.findById(orderProductDetails.cartId);
            if (!orderDetails) {
                return controller.sendErrorResponse(res, 200, { message: 'Your order not found!' });
            }
            const updateOrderStatus = { totalReturnedProductAmount: ((orderDetails.totalReturnedProductAmount + orderProductDetails.productAmount) || 0) };
            await cart_order_model_1.default.findByIdAndUpdate(orderDetails._id, updateOrderStatus);
            const updateProductStatus = {
                returnedProductAmount: orderProductDetails.productAmount,
                orderRequestedProductCancelStatus: cart_1.orderProductCancelStatusJson.refunded,
                orderProductStatus: cart_1.orderProductStatusJson.refunded,
                orderProductStatusAt: new Date(),
                orderRequestedProductCancelStatusAt: new Date()
            };
            const updatedProduct = await cart_order_product_model_1.default.findByIdAndUpdate(orderProductDetails._id, updateProductStatus, { new: true });
            if (updatedProduct) {
                const customerDetails = await customers_model_1.default.findOne({ _id: orderDetails.customerId });
                if (customerDetails) {
                    const productDetails = await product_model_1.default.aggregate((0, product_config_1.productDetailsWithVariant)({ 'productvariants._id': orderProductDetails.variantId }));
                    let query = { _id: { $exists: true } };
                    query = {
                        ...query,
                        countryId: orderDetails.countryId,
                        block: website_setup_1.websiteSetup.basicSettings,
                        blockReference: { $in: [website_setup_1.blockReferences.defualtSettings, website_setup_1.blockReferences.basicDetailsSettings, website_setup_1.blockReferences.socialMedia, website_setup_1.blockReferences.appUrls] },
                        status: '1',
                    };
                    const settingsDetails = await website_setup_model_1.default.find(query);
                    await (0, order_1.orderProductCancelStatusChangeEmail)(settingsDetails, orderDetails, newStatus, customerDetails, productDetails);
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
                const user = res.locals.user;
                return controller.sendSuccessResponse(res, {
                    requestedData: updatedOrderDetails[0],
                    message: 'Your Order is ready!'
                }, 200, {
                    userId: user._id,
                    countryId: user.countryId,
                    sourceCollection: collections_1.collections.cart.cartorders,
                    referenceData: JSON.stringify({
                        orderId: orderDetails.orderId,
                        orderCode: orderDetails.orderCode,
                        allValues: updatedOrderDetails[0]
                    }, null, 2),
                    sourceFromId: orderProductDetails.cartId,
                    sourceFromReferenceId: orderProductId,
                    sourceFrom: task_log_1.adminTaskLog.orders.order,
                    activityComment: `Order product status changed to: ${cart_1.orderProductCancelStatusMessages[newStatus]}`,
                    activity: task_log_1.adminTaskLogActivity.update,
                    activityStatus: task_log_1.adminTaskLogStatus.success
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
    async orderProductReturnStatusChange(req, res) {
        try {
            const orderProductId = req.params.id;
            const orderProductDetails = await cart_order_product_model_1.default.findOne({ _id: new mongoose_1.default.Types.ObjectId(orderProductId) });
            if (!orderProductDetails) {
                return controller.sendErrorResponse(res, 200, { message: 'Your order product not found!' });
            }
            if (orderProductDetails.orderProductStatus !== cart_1.orderProductStatusJson.delivered && orderProductDetails.orderProductStatus !== cart_1.orderProductStatusJson.returned) {
                return controller.sendErrorResponse(res, 200, { message: `You cant change to this status without delivered or returned product` });
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
            const currentDate = new Date();
            const orderProductUpdateFields = {
                [quantityChange ? 'orderRequestedProductQuantityStatus' : 'orderProductReturnStatus']: newStatus,
                [quantityChange ? 'orderRequestedProductQuantityStatusAt' : 'orderProductReturnStatusAt']: currentDate,
            };
            if (newStatus === statusJson.approved) {
                orderProductUpdateFields[quantityChange ? 'orderProductReturnQuantityApprovedStatusAt' : 'orderProductReturnApprovedStatusAt'] = currentDate;
            }
            else if (newStatus === statusJson.refunded) {
                orderProductUpdateFields[quantityChange ? 'orderProductReturnQuantityRefundStatusAt' : 'orderProductReturnRefundStatusAt'] = currentDate;
                const newQuantity = orderProductDetails.orderRequestedProductQuantity;
                const perUnitPrice = orderProductDetails.productAmount / orderProductDetails.quantity;
                orderProductUpdateFields['returnedProductAmount'] = quantityChange ? ((orderProductDetails.quantity - newQuantity) * perUnitPrice) : orderProductDetails.productAmount;
                orderProductUpdateFields['orderProductStatus'] = cart_1.orderProductStatusJson.refunded;
                orderProductUpdateFields['orderProductStatusAt'] = currentDate;
                orderUpdateFields['orderStatus'] = orderDetails.length > 1 ? cart_1.orderStatusArrayJson.partiallyRefunded : cart_1.orderStatusArrayJson.refunded;
                orderUpdateFields[orderDetails.length > 1 ? 'partiallyRefundedStatusAt' : 'refundedStatusAt'] = currentDate;
                orderUpdateFields['totalReturnedProductAmount'] = quantityChange ? (orderDetails?.totalReturnedProductAmount || 0) + ((orderProductDetails.quantity - newQuantity) * perUnitPrice) : (orderDetails?.totalReturnedProductAmount || 0) + orderProductDetails.productAmount;
            }
            else if (newStatus === statusJson.received) {
                orderProductUpdateFields['orderProductStatus'] = cart_1.orderProductStatusJson.returned;
                orderProductUpdateFields['orderProductStatusAt'] = currentDate;
                orderProductUpdateFields[quantityChange ? 'orderProductReturnQuantityReceivedStatusAt' : 'orderProductReturnReceivedStatusAt'] = currentDate;
                if (!quantityChange) {
                    updateVariantProductQuantity = orderProductDetails.quantity;
                }
                else {
                    updateVariantProductQuantity = orderProductDetails.orderRequestedProductQuantity;
                }
                orderUpdateFields['orderStatus'] = orderDetails.length > 1 ? cart_1.orderStatusArrayJson.partiallyReturned : cart_1.orderStatusArrayJson.returned;
                orderUpdateFields[orderDetails.length > 1 ? 'partiallyReturnedStatusAt' : 'returnedStatusAt'] = currentDate;
            }
            else if (newStatus === statusJson.rejected) {
                orderProductUpdateFields[quantityChange ? 'orderProductReturnQuantityRejectedStatusAt' : 'orderProductReturnRejectedStatusAt'] = currentDate;
            }
            const updatedOrderProductDetails = await cart_order_product_model_1.default.findByIdAndUpdate(orderProductDetails._id, orderProductUpdateFields);
            if (!updatedOrderProductDetails) {
                return controller.sendErrorResponse(res, 200, { message: 'Something went wrong please try again.' });
            }
            if (orderUpdateFields && (orderUpdateFields?.totalReturnedProductAmount || newStatus === statusJson.received)) {
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
                        await (0, order_1.orderProductReturnStatusChangeEmail)(settingsDetails, orderDetails, newStatus, customerDetails, productDetails);
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
                const user = res.locals.user;
                return controller.sendSuccessResponse(res, {
                    requestedData: updatedOrderDetails[0],
                    message: 'Your Order is ready!'
                }, 200, {
                    userId: user._id,
                    countryId: user.countryId,
                    sourceCollection: collections_1.collections.cart.cartorders,
                    referenceData: JSON.stringify({
                        orderId: orderDetails.orderId,
                        orderCode: orderDetails.orderCode,
                        allValues: updatedOrderDetails[0]
                    }, null, 2),
                    sourceFromId: orderProductDetails.cartId,
                    sourceFromReferenceId: orderProductId,
                    sourceFrom: task_log_1.adminTaskLog.orders.order,
                    activityComment: `Order product status changed to: ${cart_1.orderReturnStatusMessages[newStatus]}`,
                    activity: task_log_1.adminTaskLogActivity.update,
                    activityStatus: task_log_1.adminTaskLogStatus.success
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
                    await (0, order_1.orderProductReturnQuantityChangeEmail)(settingsDetails, orderDetails, newStatus, changedQuantity, customerDetails, productDetails);
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
                const user = res.locals.user;
                return controller.sendSuccessResponse(res, {
                    requestedData: updatedOrderDetails[0],
                    message: 'Your Order is ready!'
                }, 200, {
                    userId: user._id,
                    countryId: user.countryId,
                    sourceCollection: collections_1.collections.cart.cartorders,
                    referenceData: JSON.stringify({
                        orderId: orderDetails.orderId,
                        orderCode: orderDetails.orderCode,
                        allValues: updatedOrderDetails[0]
                    }, null, 2),
                    sourceFromId: orderProductDetails.cartId,
                    sourceFromReferenceId: orderProductId,
                    sourceFrom: task_log_1.adminTaskLog.orders.order,
                    activityComment: `Order product status changed to: ${cart_1.orderReturnStatusMessages[newStatus]}`,
                    activity: task_log_1.adminTaskLogActivity.update,
                    activityStatus: task_log_1.adminTaskLogStatus.success
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
            if (orderDetails.orderStatus === cart_1.orderStatusArrayJson.delivered && [
                cart_1.orderStatusArrayJson.pending,
                cart_1.orderStatusArrayJson.processing,
                cart_1.orderStatusArrayJson.packed,
                cart_1.orderStatusArrayJson.shipped,
                cart_1.orderStatusArrayJson.partiallyShipped,
                cart_1.orderStatusArrayJson.pickup,
                cart_1.orderStatusArrayJson.onHold,
            ].includes(orderStatus)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Cannot change the status back to a previous state once delivered'
                });
            }
            // Ensure that the order cannot be changed to Canceled after Delivered
            if (orderDetails.orderStatus === cart_1.orderStatusArrayJson.delivered && orderStatus === cart_1.orderStatusArrayJson.canceled) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Cannot change the status to Canceled once delivered'
                });
            }
            // Ensure that Returned status is only possible after Delivered
            if (orderStatus === cart_1.orderStatusArrayJson.returned && orderDetails.orderStatus !== cart_1.orderStatusArrayJson.delivered) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Returned status is only possible after Delivered'
                });
            }
            // Ensure that Refunded status is only possible after Returned
            if (orderStatus === cart_1.orderStatusArrayJson.refunded && ![
                cart_1.orderStatusArrayJson.returned,
                cart_1.orderStatusArrayJson.canceled,
                cart_1.orderStatusArrayJson.partiallyCanceled,
                cart_1.orderStatusArrayJson.partiallyReturned
            ].includes(orderDetails.orderStatus)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Refunded status is only possible after Returned or Canceled'
                });
            }
            if (orderStatus === cart_1.orderStatusArrayJson.canceled && [
                cart_1.orderStatusArrayJson.returned,
                cart_1.orderStatusArrayJson.partiallyReturned
            ].includes(orderDetails.orderStatus)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Canceled status is only possible after Returned or Partially Returned'
                });
            }
            const nonCancelableStatuses = [
                cart_1.orderStatusArrayJson.processing,
                cart_1.orderStatusArrayJson.packed,
                cart_1.orderStatusArrayJson.shipped,
                cart_1.orderStatusArrayJson.pickup,
                cart_1.orderStatusArrayJson.delivered,
                cart_1.orderStatusArrayJson.returned,
                cart_1.orderStatusArrayJson.refunded,
                cart_1.orderStatusArrayJson.partiallyShipped,
                cart_1.orderStatusArrayJson.onHold,
                cart_1.orderStatusArrayJson.failed,
                cart_1.orderStatusArrayJson.completed,
                cart_1.orderStatusArrayJson.partiallyDelivered,
                cart_1.orderStatusArrayJson.partiallyReturned,
                cart_1.orderStatusArrayJson.partiallyRefunded,
            ];
            if (orderStatus === cart_1.orderStatusArrayJson.canceled && nonCancelableStatuses.includes(orderDetails.orderStatus)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Cannot change the status of a Canceled Order',
                });
            }
            // Ensure that Completed status is only possible after Delivered
            if (orderStatus === cart_1.orderStatusArrayJson.completed && orderDetails.orderStatus !== cart_1.orderStatusArrayJson.delivered) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Completed status is only possible after Delivered'
                });
            }
            // Ensure that the order cannot be changed from Completed to any other status
            if (orderDetails.orderStatus === cart_1.orderStatusArrayJson.completed) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Cannot change the status once it is completed'
                });
            }
            // Ensure that the order cannot be changed from Failed
            if (orderDetails.orderStatus === cart_1.orderStatusArrayJson.failed) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Cannot change the status once it is failed'
                });
            }
            // Ensure that the order cannot be changed from Refunded
            if (orderDetails.orderStatus === cart_1.orderStatusArrayJson.refunded) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Cannot change the status once it is refunded'
                });
            }
            if ((orderDetails.orderStatus === cart_1.orderStatusArrayJson.failed) && (orderStatus === cart_1.orderStatusArrayJson.pending || orderStatus === cart_1.orderStatusArrayJson.packed || orderStatus === cart_1.orderStatusArrayJson.processing || orderStatus === cart_1.orderStatusArrayJson.shipped || orderStatus === cart_1.orderStatusArrayJson.delivered)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Failed status is cannot change to this status'
                });
            }
            if (orderDetails.orderStatus === cart_1.orderStatusArrayJson.returned && (orderStatus !== cart_1.orderStatusArrayJson.refunded)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Completed status is only possible after Refunded'
                });
            }
            const orderProductDetails = await cart_order_product_model_1.default.find({ cartId: orderDetails._id });
            if (orderProductDetails.length === 0) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Order products are not found!'
                });
            }
            orderDetails.orderStatus = orderStatus;
            const currentDate = new Date();
            let orderProductStatus = orderDetails.orderStatus;
            let allMatchFinalProductStatus = false;
            if (orderProductDetails.length > 1) {
                const partialStatusMapping = {
                    [cart_1.orderProductStatusJson.delivered]: cart_1.orderStatusArrayJson.partiallyDelivered,
                    [cart_1.orderProductStatusJson.shipped]: cart_1.orderStatusArrayJson.partiallyShipped,
                    [cart_1.orderProductStatusJson.canceled]: cart_1.orderStatusArrayJson.partiallyCanceled,
                    [cart_1.orderProductStatusJson.returned]: cart_1.orderStatusArrayJson.partiallyReturned,
                    [cart_1.orderProductStatusJson.refunded]: cart_1.orderStatusArrayJson.partiallyRefunded,
                };
                for (const [productStatus, partialStatus] of Object.entries(partialStatusMapping)) {
                    const hasPartialStatus = orderProductDetails.some((product) => product.orderProductStatus === productStatus);
                    if (hasPartialStatus) {
                        orderDetails.orderStatus = partialStatus;
                        break;
                    }
                }
                const statusToCheckMapping = {
                    [cart_1.orderStatusArrayJson.partiallyDelivered]: cart_1.orderProductStatusJson.delivered,
                    [cart_1.orderStatusArrayJson.partiallyShipped]: cart_1.orderProductStatusJson.shipped,
                    [cart_1.orderStatusArrayJson.partiallyCanceled]: cart_1.orderProductStatusJson.canceled,
                    [cart_1.orderStatusArrayJson.partiallyReturned]: cart_1.orderProductStatusJson.returned,
                    [cart_1.orderStatusArrayJson.partiallyRefunded]: cart_1.orderProductStatusJson.refunded,
                };
                const currentPartialStatus = orderDetails.orderStatus;
                if (statusToCheckMapping[currentPartialStatus]) {
                    allMatchFinalProductStatus = orderProductDetails.every((product) => (product.orderProductStatus === statusToCheckMapping[currentPartialStatus] || product.orderProductStatus === orderStatus));
                    if (allMatchFinalProductStatus) {
                        orderDetails.orderStatus = orderStatus;
                        orderProductStatus = orderStatus;
                    }
                }
            }
            switch (orderStatus) {
                case cart_1.orderStatusArrayJson.pending:
                    orderDetails.orderStatusAt = currentDate;
                    break;
                case cart_1.orderStatusArrayJson.processing:
                    orderDetails.processingStatusAt = currentDate;
                    break;
                case cart_1.orderStatusArrayJson.packed:
                    orderDetails.packedStatusAt = currentDate;
                    break;
                case cart_1.orderStatusArrayJson.shipped:
                    orderDetails.shippedStatusAt = currentDate;
                    break;
                case cart_1.orderStatusArrayJson.delivered:
                    orderDetails.deliveredStatusAt = currentDate;
                    break;
                case cart_1.orderStatusArrayJson.canceled:
                    orderDetails.canceledStatusAt = currentDate;
                    break;
                case cart_1.orderStatusArrayJson.returned:
                    orderDetails.returnedStatusAt = currentDate;
                    break;
                case cart_1.orderStatusArrayJson.refunded:
                    orderDetails.refundedStatusAt = currentDate;
                    break;
                case cart_1.orderStatusArrayJson.partiallyShipped:
                    orderDetails.partiallyShippedStatusAt = currentDate;
                    break;
                case cart_1.orderStatusArrayJson.onHold:
                    orderDetails.onHoldStatusAt = currentDate;
                    break;
                case cart_1.orderStatusArrayJson.failed:
                    orderDetails.failedStatusAt = currentDate;
                    break;
                case cart_1.orderStatusArrayJson.completed:
                    orderDetails.completedStatusAt = currentDate;
                    break;
                case cart_1.orderStatusArrayJson.pickup:
                    orderDetails.pickupStatusAt = currentDate;
                    break;
                case cart_1.orderStatusArrayJson.partiallyDelivered:
                    orderDetails.partiallyDeliveredStatusAt = currentDate;
                    break;
                case cart_1.orderStatusArrayJson.partiallyCanceled:
                    orderDetails.partiallyCanceledStatusAt = currentDate;
                    break;
                case cart_1.orderStatusArrayJson.partiallyReturned:
                    orderDetails.partiallyReturnedStatusAt = currentDate;
                    break;
                case cart_1.orderStatusArrayJson.partiallyRefunded:
                    orderDetails.partiallyRefundedStatusAt = currentDate;
                    break;
                default: break;
            }
            const updatedOrderDetails = await order_service_1.default.orderStatusUpdate(orderDetails._id, orderDetails, '1');
            if (!updatedOrderDetails) {
                return controller.sendErrorResponse(res, 500, {
                    message: 'Something went wrong!'
                });
            }
            if ([cart_1.orderStatusArrayJson.completed, cart_1.orderStatusArrayJson.delivered, cart_1.orderStatusArrayJson.pickup, cart_1.orderStatusArrayJson.shipped, cart_1.orderStatusArrayJson.packed, cart_1.orderStatusArrayJson.processing, cart_1.orderStatusArrayJson.onHold].includes(orderStatus)) {
                switch (orderProductStatus) {
                    case cart_1.orderStatusArrayJson.partiallyCanceled:
                        orderProductStatus = cart_1.orderStatusArrayJson.canceled;
                        break;
                    case cart_1.orderStatusArrayJson.partiallyReturned:
                        orderProductStatus = cart_1.orderStatusArrayJson.returned;
                        break;
                    case cart_1.orderStatusArrayJson.partiallyRefunded:
                        orderProductStatus = cart_1.orderStatusArrayJson.refunded;
                        break;
                    default:
                        break;
                }
            }
            const allMatchOrderProductStatus = orderProductDetails.every((product) => product.orderProductStatus === orderProductDetails[0].orderProductStatus);
            let exclusionMappingStatus = {};
            if (!allMatchOrderProductStatus) {
                const commonExclusionsStatus = [
                    cart_1.orderProductStatusJson.pending,
                    cart_1.orderProductStatusJson.processing,
                    cart_1.orderProductStatusJson.packed,
                    cart_1.orderProductStatusJson.shipped,
                    cart_1.orderProductStatusJson.delivered,
                    cart_1.orderProductStatusJson.pickup,
                    cart_1.orderProductStatusJson.canceled,
                    cart_1.orderProductStatusJson.returned,
                    cart_1.orderProductStatusJson.refunded,
                ];
                exclusionMappingStatus = {
                    [cart_1.orderStatusArrayJson.pending]: commonExclusionsStatus,
                    [cart_1.orderStatusArrayJson.processing]: commonExclusionsStatus,
                    [cart_1.orderStatusArrayJson.shipped]: commonExclusionsStatus,
                    [cart_1.orderStatusArrayJson.packed]: commonExclusionsStatus,
                    [cart_1.orderStatusArrayJson.partiallyShipped]: commonExclusionsStatus,
                    [cart_1.orderStatusArrayJson.onHold]: commonExclusionsStatus,
                    [cart_1.orderStatusArrayJson.delivered]: commonExclusionsStatus,
                    [cart_1.orderStatusArrayJson.partiallyDelivered]: [],
                    [cart_1.orderStatusArrayJson.partiallyCanceled]: [
                        cart_1.orderProductStatusJson.returned,
                        cart_1.orderProductStatusJson.refunded,
                    ],
                    [cart_1.orderStatusArrayJson.partiallyReturned]: [
                        cart_1.orderProductStatusJson.canceled,
                        cart_1.orderProductStatusJson.refunded,
                    ],
                    [cart_1.orderStatusArrayJson.partiallyRefunded]: [
                        cart_1.orderProductStatusJson.canceled,
                        cart_1.orderProductStatusJson.returned,
                    ],
                    [cart_1.orderStatusArrayJson.canceled]: [
                        cart_1.orderProductStatusJson.returned,
                        cart_1.orderProductStatusJson.refunded,
                    ],
                    [cart_1.orderStatusArrayJson.returned]: [
                        cart_1.orderProductStatusJson.canceled,
                        cart_1.orderProductStatusJson.refunded,
                    ],
                    [cart_1.orderStatusArrayJson.refunded]: [
                        cart_1.orderProductStatusJson.canceled,
                        cart_1.orderProductStatusJson.returned,
                    ],
                };
            }
            const exclusionStatuses = allMatchFinalProductStatus ? [] : (exclusionMappingStatus[orderProductStatus] || []);
            await cart_order_product_model_1.default.updateMany({
                cartId: orderDetails._id,
                orderProductStatus: {
                    $nin: exclusionStatuses
                }
            }, {
                $set: {
                    orderProductStatus: orderProductStatus,
                    orderProductStatusAt: currentDate
                }
            });
            if (orderStatus === cart_1.orderStatusArrayJson.failed || orderStatus === cart_1.orderStatusArrayJson.returned || orderStatus === cart_1.orderStatusArrayJson.canceled) {
                const cartProducts = await cart_order_product_model_1.default.find({ cartId: orderDetails._id }).select('variantId quantity');
                const updateProductVariant = cartProducts.map((products) => ({
                    updateOne: {
                        filter: { _id: products.variantId },
                        update: { $inc: { quantity: products.quantity } },
                    }
                }));
                await product_variants_model_1.default.bulkWrite(updateProductVariant);
            }
            if (orderStatus === cart_1.orderStatusArrayJson.refunded || orderStatus === cart_1.orderStatusArrayJson.partiallyRefunded) {
                const cartProducts = await cart_order_product_model_1.default.find({ cartId: orderDetails._id, orderProductStatus: { $in: [cart_1.orderProductStatusJson.returned, cart_1.orderProductStatusJson.refunded] } }).select('productAmount');
                if (cartProducts && cartProducts.length > 0) {
                    const bulkOperations = cartProducts.map((product) => ({
                        updateOne: {
                            filter: { _id: product._id },
                            update: { $set: { returnedProductAmount: product.productAmount } }
                        }
                    }));
                    await cart_order_product_model_1.default.bulkWrite(bulkOperations, { ordered: false });
                    const totalReturnedAmount = cartProducts.reduce((sum, product) => sum + product.productAmount, 0);
                    await cart_order_model_1.default.findByIdAndUpdate(orderDetails._id, { returnedProductAmount: totalReturnedAmount }, { new: true, useFindAndModify: false });
                }
            }
            let customerDetails = null;
            if (orderDetails.customerId) {
                customerDetails = await customer_service_1.default.findOne({ _id: orderDetails?.customerId });
                if (orderStatus === cart_1.orderStatusArrayJson.completed && customerDetails) {
                    await order_service_1.default.orderWalletAmountTransactions(orderStatus, orderDetails, customerDetails);
                }
            }
            if (orderStatus === cart_1.orderStatusArrayJson.shipped || orderStatus === cart_1.orderStatusArrayJson.delivered || orderStatus === cart_1.orderStatusArrayJson.canceled) {
                let query = { _id: { $exists: true } };
                query = {
                    ...query,
                    countryId: orderDetails.countryId,
                    block: website_setup_1.websiteSetup.basicSettings,
                    blockReference: { $in: [website_setup_1.blockReferences.defualtSettings, website_setup_1.blockReferences.basicDetailsSettings, website_setup_1.blockReferences.socialMedia, website_setup_1.blockReferences.appUrls] },
                    status: '1',
                };
                const settingsDetails = await website_setup_model_1.default.find(query);
                const tax = await tax_model_1.default.findOne({ countryId: orderDetails.countryId, status: "1" });
                await (0, order_1.orderStatusChangeEmail)(settingsDetails, orderDetails, orderStatus, updatedOrderDetails, tax, customerDetails);
            }
            const user = res.locals.user;
            return controller.sendSuccessResponse(res, {
                requestedData: updatedOrderDetails,
                message: cart_1.orderStatusMessages[orderStatus] || 'Order status updated successfully!'
            }, 200, {
                userId: user._id,
                countryId: user.countryId,
                sourceCollection: collections_1.collections.cart.cartorders,
                referenceData: JSON.stringify({
                    orderId: orderDetails.orderId,
                    orderCode: orderDetails.orderCode,
                    allValues: updatedOrderDetails[0]
                }, null, 2),
                sourceFromId: orderId,
                sourceFrom: task_log_1.adminTaskLog.orders.order,
                activityComment: `Order product status changed to: ${cart_1.orderStatusMessages[orderStatus]}`,
                activity: task_log_1.adminTaskLogActivity.update,
                activityStatus: task_log_1.adminTaskLogStatus.success
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
                const currencyCode = await country_model_1.default.findOne({ _id: orderDetails[0].country._id }, 'countryTitle currencyCode');
                const expectedDeliveryDate = (0, helpers_1.calculateExpectedDeliveryDate)(orderDetails[0].orderStatusAt, Number(commonDeliveryDays));
                // const user = res.locals.user;
                // const insertTaskLogs = {
                //     countryId: user.countryId,
                //     sourceCollection: collections.cart.cartorders,
                //     userId: user._id,
                //     referenceData: JSON.stringify({
                //         orderId: orderDetails.orderId,
                //         orderCode: orderDetails.orderCode,
                //         countryTitle: currencyCode?.countryTitle,
                //         allValues: orderDetails
                //     }, null, 2),
                //     sourceFromId: orderDetails._id.toString(),
                //     sourceFrom: adminTaskLog.orders.order,
                //     activityComment: `Generate Order PDF: ${orderDetails.orderId}`,
                //     activity: adminTaskLogActivity.create,
                //     activityStatus: adminTaskLogStatus.success
                // };
                // console.log('insertTaskLogs', insertTaskLogs);
                // await AdminTaskLogModel.create(insertTaskLogs);
                const invoicePdfGeneratorResponse = await (0, order_1.invoicePdfGenerator)(res, req, orderDetails, basicDetailsSettings, tax, expectedDeliveryDate, currencyCode?.currencyCode);
                if (!invoicePdfGeneratorResponse) {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Error generating invoice'
                    });
                }
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

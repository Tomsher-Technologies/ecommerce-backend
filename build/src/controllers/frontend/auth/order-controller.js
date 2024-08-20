"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const base_controller_1 = __importDefault(require("../../admin/base-controller"));
const cart_1 = require("../../../constants/cart");
const customers_model_1 = __importDefault(require("../../../model/frontend/customers-model"));
const common_service_1 = __importDefault(require("../../../services/frontend/guest/common-service"));
const order_service_1 = __importDefault(require("../../../services/frontend/auth/order-service"));
const cart_order_model_1 = __importDefault(require("../../../model/frontend/cart-order-model"));
const cart_order_product_model_1 = __importDefault(require("../../../model/frontend/cart-order-product-model"));
const payment_transaction_model_1 = __importDefault(require("../../../model/frontend/payment-transaction-model"));
const payment_methods_model_1 = __importDefault(require("../../../model/admin/setup/payment-methods-model"));
const controller = new base_controller_1.default();
class OrderController extends base_controller_1.default {
    async orderList(req, res) {
        try {
            const customerId = res.locals.user;
            let countryData = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'), true);
            if (!countryData) {
                return controller.sendErrorResponse(res, 200, { message: 'Country is missing' });
            }
            const customerDetails = await customers_model_1.default.findOne({ _id: customerId });
            if (!customerDetails) {
                return controller.sendErrorResponse(res, 200, { message: 'User is not found' });
            }
            const order = await order_service_1.default.orderList({
                query: {
                    $and: [
                        { customerId: customerDetails._id },
                        { countryId: countryData._id },
                        { isGuest: customerDetails.isGuest ?? false },
                        { cartStatus: { $ne: "1" } }
                    ],
                },
                hostName: req.get('origin'),
                getCartProducts: '1',
            });
            if (order) {
                return controller.sendSuccessResponse(res, {
                    requestedData: order,
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
            return controller.sendErrorResponse(res, 200, {
                message: 'Order not fount'
            });
        }
    }
    async getOrder(req, res) {
        try {
            const customerId = res.locals.user;
            const orderId = req.params.id;
            const uuid = req.header('User-Token');
            const origin = req.get('origin');
            const { getReturnProduct = '0' } = req.query;
            let countryData = await common_service_1.default.findOneCountrySubDomainWithId(origin, true);
            if (!countryData) {
                return controller.sendErrorResponse(res, 200, { message: 'Country is missing' });
            }
            if (!customerId && !uuid) {
                return controller.sendErrorResponse(res, 200, { message: 'Customer or guest user information is missing' });
            }
            let query = {
                $and: [
                    { countryId: countryData._id },
                    { _id: new mongoose_1.default.Types.ObjectId(orderId) }
                ]
            };
            if (customerId) {
                const customerDetails = await customers_model_1.default.findOne({ _id: customerId });
                if (!customerDetails) {
                    return controller.sendErrorResponse(res, 200, { message: 'User is not found' });
                }
                query.customerId = customerId;
                query.isGuest = false;
            }
            else if (uuid) {
                query.orderUuid = uuid;
                query.isGuest = true;
            }
            const order = await order_service_1.default.orderList({
                query,
                hostName: origin,
                getAddress: '1',
                getCartProducts: '1',
                getReturnProduct,
            });
            console.log('getReturnProductQ', order);
            if (order && order.length > 0) {
                let message = 'Your Order is ready!';
                if (order[0].cartStatus === cart_1.cartStatus.active) {
                    const paymentDetails = await payment_methods_model_1.default.findOne({ countryId: countryData._id, slug: cart_1.paymentMethods.tabby });
                    if (paymentDetails) {
                        const paymentLastTransaction = await payment_transaction_model_1.default.findOne({ paymentMethodId: paymentDetails._id, orderId: order[0]._id }).sort({ createdAt: -1 });
                        if (paymentLastTransaction) {
                            const paymentStatusMessageTemplate = cart_1.orderPaymentStatusMessages[paymentLastTransaction.status];
                            const paymentMethodTitle = paymentDetails.paymentMethodTitle || "Tabby";
                            const paymentStatusMessage = paymentStatusMessageTemplate.replace(/Tabby/g, paymentMethodTitle);
                            message = `Your order is ${paymentStatusMessage}.`;
                        }
                    }
                }
                return controller.sendSuccessResponse(res, {
                    requestedData: order[0],
                    message
                });
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Order not found'
                });
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 200, {
                message: 'An error occurred while fetching the order'
            });
        }
    }
    async orderReturnAndEdit(req, res) {
        try {
            const customerId = res.locals.user;
            const orderId = req.params.id;
            const { orderProducts, returnReason } = req.body;
            if (returnReason === '') {
                return controller.sendErrorResponse(res, 200, { message: 'Return eeason is required' });
            }
            if (!orderProducts || orderProducts.length === 0) {
                return controller.sendErrorResponse(res, 200, { message: 'Please select the order product to return or edit' });
            }
            if (!customerId) {
                return controller.sendErrorResponse(res, 200, { message: 'Customer or guest user information is missing' });
            }
            const orderObjectId = new mongoose_1.default.Types.ObjectId(orderId);
            const customerObjectId = new mongoose_1.default.Types.ObjectId(customerId);
            const orderDetails = await cart_order_model_1.default.findOne({
                _id: orderObjectId,
                cartStatus: { $ne: cart_1.cartStatus.active },
                orderStatus: { $ne: "0" }
            });
            if (!orderDetails) {
                return controller.sendErrorResponse(res, 200, { message: 'Order details not found!' });
            }
            if (Number(cart_1.orderStatusArrayJson.delivered) > Number(orderDetails.orderStatus)) {
                return controller.sendErrorResponse(res, 200, { message: 'Your order has not been delivered yet! Please return after the product is delivered' });
            }
            const statusMessages = {
                [cart_1.orderStatusArrayJson.canceled.toString()]: 'Your order has already been cancelled!',
                [cart_1.orderStatusArrayJson.returned.toString()]: 'Your order has already been returned!',
                [cart_1.orderStatusArrayJson.onHold.toString()]: 'Your order is on hold!',
                [cart_1.orderStatusArrayJson.failed.toString()]: 'Your order has failed!'
            };
            if ([cart_1.orderStatusArrayJson.canceled, cart_1.orderStatusArrayJson.returned, cart_1.orderStatusArrayJson.onHold, cart_1.orderStatusArrayJson.failed].map(String).includes(orderDetails.orderStatus)) {
                return controller.sendErrorResponse(res, 200, { message: statusMessages[orderDetails.orderStatus] });
            }
            const orderProductDetails = await cart_order_product_model_1.default.find({ cartId: orderDetails._id });
            if (!orderProductDetails || orderProductDetails.length === 0) {
                return controller.sendErrorResponse(res, 200, { message: 'Your order product not found!' });
            }
            let shouldUpdateTotalProductAmount = false;
            let hasErrorOccurred = false;
            let errorMessage = '';
            const updateOperations = orderProducts.map((orderProduct) => {
                const productDetail = orderProductDetails.find((detail) => detail._id.toString() === orderProduct.orderProductId);
                if (!productDetail) {
                    if (!hasErrorOccurred) {
                        errorMessage = `Order product with ID ${orderProduct.orderProductId} not found`;
                        hasErrorOccurred = true;
                    }
                    return null;
                }
                if (!['5'].includes(productDetail.orderProductStatus)) {
                    if (!hasErrorOccurred) {
                        errorMessage = `Order product with ID ${orderProduct.orderProductId} cannot be updated as its status is not '5' or '13'`;
                        hasErrorOccurred = true;
                    }
                    return null;
                }
                if (orderProduct.quantityChange && productDetail.orderRequestedProductQuantity) {
                    errorMessage = "You can't change quantity anymore. You are already changed the quantity";
                    hasErrorOccurred = true;
                }
                if (orderProduct.quantityChange && productDetail.quantity !== orderProduct.quantity) {
                    if (orderProduct.quantity < productDetail.quantity) {
                        shouldUpdateTotalProductAmount = true;
                    }
                    else {
                        errorMessage = `You cant change quantity out of ${productDetail.quantity}`;
                        hasErrorOccurred = true;
                    }
                }
                return {
                    updateOne: {
                        filter: { _id: new mongoose_1.default.Types.ObjectId(orderProduct.orderProductId) },
                        update: {
                            $set: {
                                ...(!orderProduct.quantityChange ? {
                                    orderProductReturnStatus: cart_1.orderProductReturnStatusJson.pending,
                                    orderProductReturnStatusAt: new Date(),
                                } : {
                                    orderRequestedProductQuantity: shouldUpdateTotalProductAmount ? (orderProduct.quantity < productDetail.quantity ? orderProduct.quantity : null) : null,
                                    orderRequestedProductQuantityStatus: cart_1.orderProductReturnQuantityStatusJson.pending,
                                    orderRequestedProductQuantityStatusAt: new Date(),
                                })
                            }
                        }
                    }
                };
            }).filter((op) => op !== null);
            if (hasErrorOccurred) {
                return controller.sendErrorResponse(res, 200, {
                    message: errorMessage
                });
            }
            if (updateOperations.length > 0) {
                await cart_order_product_model_1.default.bulkWrite(updateOperations);
                if (returnReason !== '') {
                    await cart_order_model_1.default.findOneAndUpdate(orderDetails._id, {
                        returnReason
                    });
                }
                const orderList = await order_service_1.default.orderList({
                    query: {
                        $and: [
                            { customerId: customerObjectId },
                            { _id: orderObjectId }
                        ]
                    },
                    hostName: req.get('origin'),
                    getAddress: '1',
                    getCartProducts: '1',
                });
                if (orderList && orderList.length > 0) {
                    return controller.sendSuccessResponse(res, {
                        requestedData: orderList[0],
                        message: shouldUpdateTotalProductAmount ? 'Order product statuses and quantities updated successfully!' : 'Order product return updated successfully!'
                    });
                }
                else {
                    return controller.sendErrorResponse(res, 200, { message: 'Order not found' });
                }
            }
            else {
                return controller.sendErrorResponse(res, 400, {
                    message: 'No valid order products found to update'
                });
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: 'An error occurred while updating the order' });
        }
    }
    async orderCancel(req, res) {
        try {
            const customerId = res.locals.user;
            const orderId = req.params.id;
            const { cancelReason } = req.body;
            if (!cancelReason) {
                return controller.sendErrorResponse(res, 200, { message: 'Cancel reason is required' });
            }
            if (!customerId) {
                return controller.sendErrorResponse(res, 200, { message: 'Customer or guest user information is missing' });
            }
            const orderObjectId = new mongoose_1.default.Types.ObjectId(orderId);
            const customerObjectId = new mongoose_1.default.Types.ObjectId(customerId);
            const orderDetails = await cart_order_model_1.default.findOne({
                _id: orderObjectId,
                cartStatus: { $ne: "1" },
                orderStatus: { $ne: "0" }
            });
            if (!orderDetails) {
                return controller.sendErrorResponse(res, 200, { message: 'Order details not found!' });
            }
            if (Number(orderDetails.orderStatus) === 6) {
                return controller.sendErrorResponse(res, 200, { message: 'Your order are already cancelled!' });
            }
            if (Number(orderDetails.orderStatus) > 1) {
                return controller.sendErrorResponse(res, 200, { message: 'Your order has been processed. You cannot cancel this order now!' });
            }
            await cart_order_model_1.default.findByIdAndUpdate(orderObjectId, { orderStatus: "6", cancelReason });
            const orderList = await order_service_1.default.orderList({
                query: {
                    $and: [
                        { customerId: customerObjectId },
                        { _id: orderObjectId }
                    ]
                },
                hostName: req.get('origin'),
                getAddress: '1',
                getCartProducts: '1',
            });
            if (orderList && orderList.length > 0) {
                return controller.sendSuccessResponse(res, {
                    requestedData: orderList,
                    message: 'Your order has been successfully cancelled!'
                });
            }
            else {
                return controller.sendErrorResponse(res, 200, { message: 'Order not found' });
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 200, { message: 'An error occurred while cancelling the order' });
        }
    }
}
exports.default = new OrderController();

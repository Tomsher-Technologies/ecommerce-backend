"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_controller_1 = __importDefault(require("../../admin/base-controller"));
const common_service_1 = __importDefault(require("../../../services/frontend/guest/common-service"));
const customers_model_1 = __importDefault(require("../../../model/frontend/customers-model"));
const mongoose_1 = __importDefault(require("mongoose"));
const order_service_1 = __importDefault(require("../../../services/frontend/auth/order-service"));
const cart_order_model_1 = __importDefault(require("../../../model/frontend/cart-order-model"));
const cart_order_product_model_1 = __importDefault(require("../../../model/frontend/cart-order-product-model"));
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
            let countryData = await common_service_1.default.findOneCountrySubDomainWithId(origin, true);
            if (!countryData) {
                return controller.sendErrorResponse(res, 200, { message: 'Country is missing' });
            }
            if (!customerId && !uuid) {
                return controller.sendErrorResponse(res, 200, { message: 'Customer or guest user information is missing' });
            }
            const query = {
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
            console.log('customerDetails', customerId);
            const order = await order_service_1.default.orderList({
                query,
                hostName: origin,
                getAddress: '1',
                getCartProducts: '1',
            });
            if (order && order.length > 0) {
                return controller.sendSuccessResponse(res, {
                    requestedData: order[0],
                    message: 'Your Order is ready!'
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
            const { orderProducts, returnReson } = req.body;
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
                cartStatus: { $ne: "1" },
                orderStatus: { $ne: "0" }
            });
            if (!orderDetails) {
                return controller.sendErrorResponse(res, 200, { message: 'Order details not found!' });
            }
            if (Number(orderDetails.orderStatus) < 4) {
                return controller.sendErrorResponse(res, 200, { message: 'Your order has not been delivered yet! Please return after the product is delivered' });
            }
            if ([6, 7, 10, 11].includes(Number(orderDetails.orderStatus))) {
                const statusMessages = {
                    6: 'Your order has already been cancelled!',
                    7: 'Your order has already been cancelled!',
                    10: 'Your order is on hold!',
                    11: 'Your order has failed!'
                };
                return controller.sendErrorResponse(res, 200, { message: statusMessages[Number(orderDetails.orderStatus)] });
            }
            const orderProductDetails = await cart_order_product_model_1.default.find({ cartId: orderDetails._id });
            if (!orderProductDetails || orderProductDetails.length === 0) {
                return controller.sendErrorResponse(res, 200, { message: 'Your order product not found!' });
            }
            let shouldUpdateTotalProductAmount = false;
            let hasErrorOccurred = false;
            const updateOperations = orderProducts.map((orderProduct) => {
                const productDetail = orderProductDetails.find((detail) => detail._id.toString() === orderProduct.orderProductId);
                if (!productDetail) {
                    if (!hasErrorOccurred) {
                        controller.sendErrorResponse(res, 400, {
                            message: `Order product with ID ${orderProduct.orderProductId} not found`
                        });
                        hasErrorOccurred = true;
                    }
                    return null;
                }
                if (!['5'].includes(productDetail.orderProductStatus)) {
                    if (!hasErrorOccurred) {
                        controller.sendErrorResponse(res, 400, {
                            message: `Order product with ID ${orderProduct.orderProductId} cannot be updated as its status is not '5' or '13'`
                        });
                        hasErrorOccurred = true;
                    }
                    return null;
                }
                if (productDetail.quantity !== orderProduct.quantity) {
                    shouldUpdateTotalProductAmount = true;
                }
                return {
                    updateOne: {
                        filter: { _id: new mongoose_1.default.Types.ObjectId(orderProduct.orderProductId) },
                        update: {
                            $set: {
                                orderRequestedProductStatus: "6",
                                orderRequestedProductStatusAt: new Date(),
                                orderRequestedProductQuantity: shouldUpdateTotalProductAmount ? (orderProduct.quantity > 1 ? orderProduct.quantity : null) : null
                            }
                        }
                    }
                };
            }).filter((op) => op !== null);
            if (hasErrorOccurred) {
                return;
            }
            if (updateOperations.length > 0) {
                await cart_order_product_model_1.default.bulkWrite(updateOperations);
                if (returnReson !== '') {
                    await cart_order_model_1.default.findOneAndDelete(orderDetails._id, {
                        returnReson
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
                        message: 'Order product statuses and quantities updated successfully!'
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
            await cart_order_model_1.default.findByIdAndUpdate(orderObjectId, { orderStatus: "6" });
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

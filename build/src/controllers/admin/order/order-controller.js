"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const helpers_1 = require("../../../utils/helpers");
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const order_service_1 = __importDefault(require("../../../services/admin/order/order-service"));
const mongoose_1 = __importDefault(require("mongoose"));
const cart_order_model_1 = __importDefault(require("../../../model/frontend/cart-order-model"));
const cart_1 = require("../../../constants/cart");
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
            // if (status && status !== '') {
            //     query.status = { $in: Array.isArray(status) ? status : [status] };
            // } else {
            //     query.cartStatus = '1';
            // }
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
            return controller.sendSuccessResponse(res, {
                requestedData: order,
                // totalCount: await CouponService.getTotalCount(query),
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
            console.log('orderDetails', orderDetails);
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
            orderDetails.orderStatus = orderStatus;
            switch (orderStatus) {
                case '1':
                    orderDetails.orderStatusAt = new Date();
                    break;
                case '2':
                    orderDetails.processingStatusAt = new Date();
                    break;
                case '3':
                    orderDetails.packedStatusAt = new Date();
                    break;
                case '4':
                    orderDetails.shippedStatusAt = new Date();
                    break;
                case '5':
                    orderDetails.deliveredStatusAt = new Date();
                    break;
                case '6':
                    orderDetails.canceledStatusAt = new Date();
                    break;
                case '7':
                    orderDetails.returnedStatusAt = new Date();
                    break;
                case '8':
                    orderDetails.refundedStatusAt = new Date();
                    break;
                case '9':
                    orderDetails.partiallyShippedStatusAt = new Date();
                    break;
                case '10':
                    orderDetails.onHoldStatusAt = new Date();
                    break;
                case '11':
                    orderDetails.failedStatusAt = new Date();
                    break;
                case '12':
                    orderDetails.completedStatusAt = new Date();
                    break;
                case '13':
                    orderDetails.pickupStatusAt = new Date();
                    break;
                default: break;
            }
            const updatedOrderDetails = await order_service_1.default.orderStatusUpdate(orderDetails._id, orderDetails);
            return controller.sendSuccessResponse(res, {
                requestedData: updatedOrderDetails,
                message: cart_1.orderStatusMessages[orderStatus] || 'Order status updated successfully!'
            });
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, {
                message: 'Order not fount'
            });
        }
    }
}
exports.default = new OrdersController();

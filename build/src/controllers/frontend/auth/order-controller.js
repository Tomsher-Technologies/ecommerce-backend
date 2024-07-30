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
    async orderCancel(req, res) {
        try {
            const customerId = res.locals.user;
            const orderId = req.params.id;
            let countryData = await common_service_1.default.findOneCountrySubDomainWithId(origin, true);
            if (!countryData) {
                return controller.sendErrorResponse(res, 200, { message: 'Country is missing' });
            }
            if (!customerId) {
                return controller.sendErrorResponse(res, 200, { message: 'Customer or guest user information is missing' });
            }
            const query = {
                $and: [
                    { countryId: countryData._id },
                    { customerId: new mongoose_1.default.Types.ObjectId(customerId) },
                    { _id: new mongoose_1.default.Types.ObjectId(orderId) }
                ]
            };
            const orderDetails = await cart_order_model_1.default.findOne({ _id: new mongoose_1.default.Types.ObjectId(orderId) });
            if (!orderDetails) {
                return controller.sendErrorResponse(res, 200, { message: 'Order details not found!' });
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
}
exports.default = new OrderController();

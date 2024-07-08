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
                        { cartStatus: { $ne: "1" } }
                    ],
                },
                hostName: req.get('origin'),
                getCartProducts: '1',
            });
            console.log('order', order);
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
            let countryData = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'), true);
            if (!countryData) {
                return controller.sendErrorResponse(res, 200, { message: 'Country is missing' });
            }
            const customerDetails = await customers_model_1.default.findOne({ _id: customerId });
            if (!customerDetails) {
                return controller.sendErrorResponse(res, 200, { message: 'User is not found' });
            }
            //offer - specification
            const order = await order_service_1.default.orderList({
                query: {
                    $and: [
                        { customerId: customerDetails._id },
                        { countryId: countryData._id },
                        // { cartStatus: "2" },
                        { _id: new mongoose_1.default.Types.ObjectId(orderId) }
                    ],
                },
                hostName: req.get('origin'),
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
}
exports.default = new OrderController();

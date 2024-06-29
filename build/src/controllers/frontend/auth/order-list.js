"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_controller_1 = __importDefault(require("../../admin/base-controller"));
const common_service_1 = __importDefault(require("../../../services/frontend/guest/common-service"));
const cart_service_1 = __importDefault(require("../../../services/frontend/cart-service"));
const customers_model_1 = __importDefault(require("../../../model/frontend/customers-model"));
const controller = new base_controller_1.default();
class CheckoutController extends base_controller_1.default {
    async checkout(req, res) {
        try {
            const customerId = res.locals.user;
            let countryData = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'), true);
            if (!countryData) {
                return controller.sendErrorResponse(res, 500, { message: 'Country is missing' });
            }
            const customerDetails = await customers_model_1.default.findOne({ _id: customerId });
            if (!customerDetails) {
                return controller.sendErrorResponse(res, 500, { message: 'User is not found' });
            }
            const order = await cart_service_1.default.findCartPopulate({
                query: {
                    $and: [
                        { customerId: customerId },
                        { countryId: countryData._id },
                        { cartStatus: "1" }
                    ],
                },
                hostName: req.get('origin'),
            });
        }
        catch (error) {
        }
    }
}
exports.default = new CheckoutController();

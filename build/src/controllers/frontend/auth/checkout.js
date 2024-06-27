"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_controller_1 = __importDefault(require("../../admin/base-controller"));
const common_service_1 = __importDefault(require("../../../services/frontend/guest/common-service"));
const cart_service_1 = __importDefault(require("../../../services/frontend/cart-service"));
const controller = new base_controller_1.default();
class CheckoutController extends base_controller_1.default {
    async checkout(req, res) {
        try {
            const customerId = res.locals.user;
            let countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            const cart = await cart_service_1.default.findCartPopulate({
                query: {
                    $and: [
                        { customerId: customerId },
                        { countryId: countryId },
                        { cartStatus: "1" }
                    ],
                },
                hostName: req.get('origin'),
            });
            console.log("*******", cart);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 200, {
                message: error.message || 'Some error occurred while Checkout',
            });
        }
    }
}
exports.default = new CheckoutController();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_controller_1 = __importDefault(require("../../admin/base-controller"));
const common_service_1 = __importDefault(require("../../../services/frontend/guest/common-service"));
const cart_service_1 = __importDefault(require("../../../services/frontend/cart-service"));
const payment_methods_model_1 = __importDefault(require("../../../model/admin/setup/payment-methods-model"));
const cart_1 = require("../../../constants/cart");
const website_setup_model_1 = __importDefault(require("../../../model/admin/setup/website-setup-model"));
const website_setup_1 = require("../../../constants/website-setup");
const coupon_service_1 = __importDefault(require("../../../services/frontend/auth/coupon-service"));
const checkout_schema_1 = require("../../../utils/schemas/frontend/auth/checkout-schema");
const helpers_1 = require("../../../utils/helpers");
const tap_payment_1 = require("../../../lib/tap-payment");
const customers_model_1 = __importDefault(require("../../../model/frontend/customers-model"));
const cart_utils_1 = require("../../../utils/frontend/cart-utils");
const payment_transaction_model_1 = __importDefault(require("../../../model/frontend/payment-transaction-model"));
const checkout_service_1 = __importDefault(require("../../../services/frontend/checkout-service"));
const customer_address_model_1 = __importDefault(require("../../../model/frontend/customer-address-model"));
const tabby_payment_1 = require("../../../lib/tabby-payment");
const controller = new base_controller_1.default();
class CheckoutController extends base_controller_1.default {
    async checkout(req, res) {
        try {
            const customerId = res.locals.user;
            let countryData = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'), true);
            if (!countryData) {
                return controller.sendErrorResponse(res, 500, { message: 'Country is missing' });
            }
            const validatedData = checkout_schema_1.checkoutSchema.safeParse(req.body);
            if (validatedData.success) {
                const { deviceType, couponCode, paymentMethodId, shippingId, billingId, } = validatedData.data;
                const customerDetails = await customers_model_1.default.findOne({ _id: customerId });
                if (!customerDetails) {
                    return controller.sendErrorResponse(res, 500, { message: 'User is not found' });
                }
                const paymentMethod = await payment_methods_model_1.default.findOne({ _id: paymentMethodId });
                if (!paymentMethod) {
                    return controller.sendErrorResponse(res, 500, { message: 'Something went wrong, payment method is not found' });
                }
                const cartDetails = await cart_service_1.default.findCartPopulate({
                    query: {
                        $and: [
                            { customerId: customerId },
                            { countryId: countryData._id },
                            { cartStatus: "1" }
                        ],
                    },
                    hostName: req.get('origin'),
                });
                if (!cartDetails) {
                    return controller.sendErrorResponse(res, 500, { message: 'Cart not found!' });
                }
                let cartUpdate = {
                    paymentMethodCharge: 0,
                    couponId: null,
                    totalCouponAmount: 0,
                    totalAmount: cartDetails.totalAmount,
                    shippingId: shippingId,
                    billingId: billingId
                };
                if (couponCode && deviceType) {
                    const query = {
                        countryId: countryData._id,
                        couponCode,
                    };
                    const couponDetails = await coupon_service_1.default.checkCouponCode({ query, user: customerId, deviceType });
                    if (couponDetails?.status) {
                        cartUpdate = {
                            ...cartUpdate,
                            couponId: couponDetails?.requestedData._id,
                        };
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: couponDetails?.message,
                        });
                    }
                }
                cartUpdate = {
                    ...cartUpdate,
                    totalCouponAmount: 0,
                    totalAmount: cartDetails.totalAmount,
                };
                let paymentRedirectionUrl = '';
                if (paymentMethod.slug !== cart_1.paymentMethods.cashOnDelivery) {
                    if (paymentMethod && paymentMethod.slug == cart_1.paymentMethods.tap) {
                        const tapDefaultValues = (0, cart_utils_1.tapPaymentGatwayDefaultValues)(countryData, { ...cartUpdate, _id: cartDetails._id }, customerDetails);
                        const tapResponse = await (0, tap_payment_1.tapPaymentCreate)(tapDefaultValues);
                        if (tapResponse && tapResponse.status === cart_1.tapPaymentGatwayStatus.initiated && tapResponse.id && tapResponse.transaction) {
                            const paymentTransaction = await payment_transaction_model_1.default.create({
                                transactionId: tapResponse.id,
                                orderId: cartDetails._id,
                                data: '',
                                orderStatus: cart_1.orderPaymentStatus.pending, // Pending
                                createdAt: new Date(),
                            });
                            if (!paymentTransaction) {
                                return controller.sendErrorResponse(res, 500, { message: 'Something went wrong, Payment transaction is failed. Please try again' });
                            }
                            paymentRedirectionUrl = tapResponse.transaction.url;
                        }
                    }
                    else if (paymentMethod && paymentMethod.slug == cart_1.paymentMethods.tabby) {
                        const shippingAddressDetails = await customer_address_model_1.default.findById(shippingId);
                        // const cartProductsDetails: any = await CartOrderProductsModel.find({ cartId: cartDetails._id });
                        const tabbyDefaultValues = (0, cart_utils_1.tabbyPaymentGatwayDefaultValues)(countryData, {
                            ...cartUpdate,
                            _id: cartDetails._id,
                            orderComments: cartDetails.orderComments,
                            cartStatusAt: cartDetails.cartStatusAt,
                            totalDiscountAmount: cartDetails.totalDiscountAmount,
                            totalTaxAmount: cartDetails.totalTaxAmount,
                            products: cartDetails?.products
                        }, customerDetails, paymentMethod, shippingAddressDetails);
                        const tapResponse = await (0, tabby_payment_1.tabbyPaymentCreate)(tabbyDefaultValues);
                        console.log('tapResponse', tapResponse);
                    }
                }
                else {
                    const codAmount = await website_setup_model_1.default.findOne({ blockReference: website_setup_1.blockReferences.defualtSettings });
                    cartUpdate = {
                        ...cartUpdate,
                        paymentMethodCharge: codAmount.blockValues.codCharge
                    };
                }
                const updateCart = await cart_service_1.default.update(cartDetails._id, cartUpdate);
                if (!updateCart) {
                    return controller.sendErrorResponse(res, 500, { message: 'Something went wrong, Cart updation is failed. Please try again' });
                }
                return controller.sendSuccessResponse(res, {
                    requestedData: {
                        orderId: cartDetails._id,
                        orderType: paymentMethod.slug,
                        paymentRedirectionUrl
                    },
                    message: 'Order successfully Created!'
                }, 200);
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                });
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 200, {
                message: error.message || 'Some error occurred while Checkout',
            });
        }
    }
    async tapSuccessResponse(req, res) {
        const { tap_id, data } = req.query;
        if (!tap_id) {
            res.redirect("https://developers.tap.company/reference/retrieve-an-authorize?tap_id=fail"); // fail
            return false;
        }
        const tapResponse = await (0, tap_payment_1.tapPaymentRetrieve)(tap_id);
        if (tapResponse.status) {
            const retValResponse = await checkout_service_1.default.paymentResponse({
                transactionId: tap_id, allPaymentResponseData: data,
                paymentStatus: (tapResponse.status === cart_1.tapPaymentGatwayStatus.authorized || tapResponse.status === cart_1.tapPaymentGatwayStatus.captured) ?
                    cart_1.orderPaymentStatus.success : ((tapResponse.status === cart_1.tapPaymentGatwayStatus.cancelled) ? tapResponse.cancelled : cart_1.orderPaymentStatus.failure)
            });
            if (retValResponse.status) {
                res.redirect("http://stackoverflow.com"); // success
                return true;
            }
            else {
                res.redirect(`https://developers.tap.company/reference/retrieve-an-authorize?${retValResponse.message}`); // fail
                return false;
            }
        }
    }
}
exports.default = new CheckoutController();

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
const tabby_payment_1 = require("../../../lib/tabby-payment");
const tap_payment_1 = require("../../../lib/tap-payment");
const customers_model_1 = __importDefault(require("../../../model/frontend/customers-model"));
const cart_utils_1 = require("../../../utils/frontend/cart-utils");
const payment_transaction_model_1 = __importDefault(require("../../../model/frontend/payment-transaction-model"));
const checkout_service_1 = __importDefault(require("../../../services/frontend/checkout-service"));
const customer_address_model_1 = __importDefault(require("../../../model/frontend/customer-address-model"));
const controller = new base_controller_1.default();
class CheckoutController extends base_controller_1.default {
    async checkout(req, res) {
        try {
            const customerId = res.locals.user._id;
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
                            { cartStatus: cart_1.cartStatus.active }
                        ],
                    },
                    hostName: req.get('origin'),
                });
                if (!cartDetails) {
                    return controller.sendErrorResponse(res, 500, { message: 'Cart not found!' });
                }
                let cartUpdate = {
                    cartStatus: cart_1.cartStatus.active,
                    paymentMethodCharge: 0,
                    couponId: null,
                    totalCouponAmount: 0,
                    totalAmount: cartDetails.totalAmount,
                    shippingId: shippingId,
                    billingId: billingId || null,
                    paymentMethodId: paymentMethod._id,
                    orderStatusAt: null,
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
                let paymentData = null;
                if (paymentMethod.slug !== cart_1.paymentMethods.cashOnDelivery) {
                    if (paymentMethod && paymentMethod.slug == cart_1.paymentMethods.tap) {
                        const tapDefaultValues = (0, cart_utils_1.tapPaymentGatwayDefaultValues)(countryData, { ...cartUpdate, _id: cartDetails._id }, customerDetails, paymentMethod.paymentMethodValues);
                        const tapResponse = await (0, tap_payment_1.tapPaymentCreate)(tapDefaultValues, paymentMethod.paymentMethodValues);
                        if (tapResponse && tapResponse.status === cart_1.tapPaymentGatwayStatus.initiated && tapResponse.id && tapResponse.transaction) {
                            const paymentTransaction = await payment_transaction_model_1.default.create({
                                paymentMethodId,
                                transactionId: tapResponse.id,
                                orderId: cartDetails._id,
                                data: '',
                                orderStatus: cart_1.orderPaymentStatus.pending, // Pending
                                createdAt: new Date(),
                            });
                            if (!paymentTransaction) {
                                return controller.sendErrorResponse(res, 500, { message: 'Something went wrong, Payment transaction is failed. Please try again' });
                            }
                            paymentData = { paymentRedirectionUrl: tapResponse.transaction.url };
                        }
                    }
                    else if (paymentMethod && paymentMethod.slug == cart_1.paymentMethods.tabby) {
                        if (paymentMethod.paymentMethodValues) {
                            const shippingAddressDetails = await customer_address_model_1.default.findById(shippingId);
                            // const cartProductsDetails: any = await CartOrderProductsModel.find({ cartId: cartDetails._id });
                            const tabbyDefaultValues = (0, cart_utils_1.tabbyPaymentGatwayDefaultValues)(countryData, {
                                ...cartUpdate,
                                _id: cartDetails._id,
                                orderComments: cartDetails.orderComments,
                                cartStatusAt: cartDetails.cartStatusAt,
                                totalDiscountAmount: cartDetails.totalDiscountAmount,
                                totalShippingAmount: cartDetails.totalShippingAmount,
                                totalTaxAmount: cartDetails.totalTaxAmount,
                                products: cartDetails?.products
                            }, customerDetails, paymentMethod, shippingAddressDetails);
                            const tabbyResponse = await (0, tabby_payment_1.tabbyPaymentCreate)(tabbyDefaultValues, paymentMethod.paymentMethodValues);
                            if (tabbyResponse && tabbyResponse.payment) {
                                const paymentTransaction = await payment_transaction_model_1.default.create({
                                    paymentMethodId,
                                    transactionId: tabbyResponse.id,
                                    paymentId: tabbyResponse.payment.id,
                                    orderId: cartDetails._id,
                                    data: JSON.stringify(tabbyResponse),
                                    orderStatus: cart_1.orderPaymentStatus.pending, // Pending
                                    createdAt: new Date(),
                                });
                                if (!paymentTransaction) {
                                    return controller.sendErrorResponse(res, 500, { message: 'Something went wrong, Payment transaction is failed. Please try again' });
                                }
                            }
                            else {
                                return controller.sendErrorResponse(res, 500, { message: 'Something went wrong, Payment transaction is failed. Please try again' });
                            }
                            if (tabbyResponse && tabbyResponse.configuration && tabbyResponse.configuration.available_products && tabbyResponse.configuration.available_products.installments?.length > 0) {
                                paymentData = {
                                    transactionId: tabbyResponse.id,
                                    ...tabbyResponse.configuration.available_products
                                };
                            }
                        }
                        else {
                            return controller.sendErrorResponse(res, 500, { message: 'Payment method values is incorrect. Please connect with cutomer care or try another payment methods' });
                        }
                    }
                }
                else {
                    const codAmount = await website_setup_model_1.default.findOne({ blockReference: website_setup_1.blockReferences.defualtSettings });
                    cartUpdate = {
                        ...cartUpdate,
                        paymentMethodCharge: codAmount?.blockValues?.codCharge || 0,
                        cartStatus: "2",
                        orderStatus: cart_1.orderStatusMap['1'].value,
                        orderStatusAt: new Date(),
                    };
                }
                const updateCart = await cart_service_1.default.update(cartDetails._id, cartUpdate);
                if (!updateCart) {
                    return controller.sendErrorResponse(res, 500, { message: 'Something went wrong, Cart updation is failed. Please try again' });
                }
                if (paymentMethod && paymentMethod.slug == cart_1.paymentMethods.cashOnDelivery) {
                    await checkout_service_1.default.cartUpdation({ ...updateCart, products: cartDetails.products, customerDetails, paymentMethod }, true);
                }
                return controller.sendSuccessResponse(res, {
                    requestedData: {
                        orderId: updateCart._id,
                        orderType: paymentMethod.slug,
                        paymentData
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
    async tabbyCheckoutRetrieveDetails(req, res) {
        try {
            const tabbyId = req.params.tabby;
            let countryData = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'), true);
            if (!countryData) {
                return controller.sendErrorResponse(res, 500, { message: 'Country is missing' });
            }
            const paymentMethod = await payment_methods_model_1.default.findOne({ slug: cart_1.paymentMethods.tabby });
            if (!paymentMethod) {
                return controller.sendErrorResponse(res, 500, { message: 'Something went wrong, payment method is not found' });
            }
            const tabbyResponse = await (0, tabby_payment_1.tabbyCheckoutRetrieve)(tabbyId, paymentMethod.paymentMethodValues);
            if (tabbyResponse && tabbyResponse.configuration && tabbyResponse.configuration.available_products && tabbyResponse.configuration.available_products.installments?.length > 0) {
                const customerId = res.locals.user._id;
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
                return controller.sendSuccessResponse(res, {
                    requestedData: {
                        cartDetails,
                        orderType: cart_1.orderTypes.tabby,
                        paymentData: tabbyResponse.configuration.available_products
                    },
                    message: 'Order successfully Created!'
                }, 200);
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 200, {
                message: error.message || 'Some error occurred while get tabby payment details',
            });
        }
    }
    async tapSuccessResponse(req, res) {
        const { tap_id, data } = req.query;
        if (!tap_id) {
            res.redirect("https://www.timehouse.store/order-response?status=failure"); // failure
            return false;
        }
        const paymentDetails = await payment_transaction_model_1.default.findOne({ transactionId: tap_id });
        if (!paymentDetails) {
            res.redirect("https://www.timehouse.store/order-response?status=failure&message=Payment transaction. Please contact administrator"); // failure
        }
        const paymentMethod = await payment_methods_model_1.default.findOne({ _id: paymentDetails?.paymentMethodId });
        if (!paymentMethod) {
            res.redirect("https://www.timehouse.store/order-response?status=failure&message=Payment method not found. Please contact administrator"); // failure
        }
        const tapResponse = await (0, tap_payment_1.tapPaymentRetrieve)(tap_id, paymentMethod.paymentMethodValues);
        if (tapResponse.status) {
            const retValResponse = await checkout_service_1.default.paymentResponse({
                paymentDetails,
                allPaymentResponseData: data,
                paymentStatus: (tapResponse.status === cart_1.tapPaymentGatwayStatus.authorized || tapResponse.status === cart_1.tapPaymentGatwayStatus.captured) ?
                    cart_1.orderPaymentStatus.success : ((tapResponse.status === cart_1.tapPaymentGatwayStatus.cancelled) ? tapResponse.cancelled : cart_1.orderPaymentStatus.failure)
            });
            if (retValResponse.status) {
                res.redirect(`https://www.timehouse.store/order-response/${retValResponse?._id}?status=success`); // success
                return true;
            }
            else {
                res.redirect(`https://www.timehouse.store/order-response/${retValResponse?._id}?status=${tapResponse?.status}`); // failure
                return false;
            }
        }
        else {
            res.redirect(`https://www.timehouse.store/order-response/${paymentDetails?.orderId}?status=${tapResponse?.status}`); // failure
            return false;
        }
    }
    async tabbySuccessResponse(req, res) {
        const { payment_id } = req.query;
        if (!payment_id) {
            res.redirect("https://www.timehouse.store/order-response?status=failure"); // failure
            return false;
        }
        const paymentDetails = await payment_transaction_model_1.default.findOne({ paymentId: payment_id });
        if (!paymentDetails) {
            res.redirect("https://www.timehouse.store/order-response?status=failure&message=Payment transaction. Please contact administrator"); // failure
        }
        const paymentMethod = await payment_methods_model_1.default.findOne({ _id: paymentDetails?.paymentMethodId });
        if (!paymentMethod) {
            res.redirect("https://www.timehouse.store/order-response?status=failure&message=Payment method not found. Please contact administrator"); // failure
        }
        const tabbyResponse = await (0, tabby_payment_1.tabbyPaymentRetrieve)(payment_id, paymentMethod.paymentMethodValues);
        if (tabbyResponse.status) {
            const retValResponse = await checkout_service_1.default.paymentResponse({
                paymentDetails,
                allPaymentResponseData: tabbyResponse,
                paymentStatus: (tabbyResponse.status === cart_1.tabbyPaymentGatwaySuccessStatus.authorized || tabbyResponse.status === cart_1.tabbyPaymentGatwaySuccessStatus.closed) ?
                    cart_1.orderPaymentStatus.success : ((tabbyResponse.status === cart_1.tabbyPaymentGatwaySuccessStatus.rejected) ? tabbyResponse.cancelled : cart_1.orderPaymentStatus.expired)
            });
            if (retValResponse.status) {
                res.redirect(`https://www.timehouse.store/order-response/${retValResponse?._id}?status=success`); // success
                return true;
            }
            else {
                res.redirect(`https://www.timehouse.store/order-response/${retValResponse?._id}?status=${tabbyResponse?.status}`); // failure
                return false;
            }
        }
        else {
            res.redirect(`https://www.timehouse.store/order-response/${paymentDetails?.orderId}?status=${tabbyResponse?.status}`); // failure
            return false;
        }
    }
}
exports.default = new CheckoutController();

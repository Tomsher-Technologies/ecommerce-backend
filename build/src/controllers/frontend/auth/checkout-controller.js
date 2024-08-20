"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
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
const tabby_payment_1 = require("../../../lib/payment-gateway/tabby-payment");
const tap_payment_1 = require("../../../lib/payment-gateway/tap-payment");
const customers_model_1 = __importDefault(require("../../../model/frontend/customers-model"));
const cart_utils_1 = require("../../../utils/frontend/cart-utils");
const payment_transaction_model_1 = __importDefault(require("../../../model/frontend/payment-transaction-model"));
const checkout_service_1 = __importDefault(require("../../../services/frontend/checkout-service"));
const customer_address_model_1 = __importDefault(require("../../../model/frontend/customer-address-model"));
const network_payments_1 = require("../../../lib/payment-gateway/network-payments");
const product_variants_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-variants-model"));
const tamara_payments_1 = require("../../../lib/payment-gateway/tamara-payments");
const cart_order_model_1 = __importDefault(require("../../../model/frontend/cart-order-model"));
const controller = new base_controller_1.default();
class CheckoutController extends base_controller_1.default {
    async checkout(req, res) {
        try {
            const customerId = res.locals.user._id;
            let countryData = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'), true);
            if (!countryData) {
                return controller.sendErrorResponse(res, 200, { message: 'Country is missing' });
            }
            const validatedData = checkout_schema_1.checkoutSchema.safeParse(req.body);
            if (validatedData.success) {
                const { notVerifyUser = false, deviceType, couponCode, paymentMethodId, shippingId, billingId, pickupStoreId = '', stateId = '', cityId = '', orderComments } = validatedData.data;
                const customerDetails = await customers_model_1.default.findOne({ _id: customerId });
                if (!customerDetails || (!notVerifyUser && !customerDetails.isVerified)) {
                    const message = !customerDetails
                        ? 'User is not found'
                        : 'User is not verified';
                    return controller.sendErrorResponse(res, 200, { message });
                }
                const paymentMethod = await payment_methods_model_1.default.findOne({ _id: paymentMethodId });
                if (!paymentMethod) {
                    return controller.sendErrorResponse(res, 200, { message: 'Something went wrong, payment method is not found' });
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
                    return controller.sendErrorResponse(res, 200, { message: 'Current cart is missing, please add items and try agin' });
                }
                const uuid = req.header('User-Token');
                const variantIds = cartDetails.products.map((product) => product.variantId);
                // go to product variant model check 
                const variantQuantities = cartDetails.products.reduce((calculateQuantity, product) => {
                    calculateQuantity[product.variantId.toString()] = product.quantity;
                    return calculateQuantity;
                }, {});
                const productVariants = await product_variants_model_1.default.find({
                    _id: { $in: variantIds }
                });
                const errorArray = [];
                for (const variant of productVariants) {
                    const requiredQuantity = variantQuantities[variant._id.toString()];
                    var productTitle;
                    if (variant.extraProductTitle) {
                        productTitle = variant.extraProductTitle;
                    }
                    else {
                        productTitle = cartDetails.products.find((product) => product.variantId === variant._id)?.productDetails?.productTitle;
                    }
                    if (variant.quantity == 0) {
                        errorArray.push({ productTitle: productTitle, message: 'The product in your cart is now out of stock. Please remove it to proceed with your purchase or choose a different item.' });
                    }
                    else if (variant.quantity < requiredQuantity) {
                        errorArray.push({ productTitle: productTitle, message: 'The quantity of the product in your cart exceeds the available stock. Please update the quantity.' });
                    }
                }
                if (errorArray.length > 0) {
                    return controller.sendErrorResponse(res, 200, {
                        validation: errorArray,
                        message: 'Validation error',
                    });
                }
                if (!cartDetails) {
                    return controller.sendErrorResponse(res, 200, { message: 'Cart not found!' });
                }
                let cartUpdate = {
                    orderUuid: uuid,
                    shippingId: shippingId || null,
                    billingId: billingId || null,
                    paymentMethodId: paymentMethod._id,
                    couponId: null,
                    pickupStoreId: pickupStoreId || null,
                    stateId: stateId || null,
                    cityId: cityId || null,
                    cartStatus: cart_1.cartStatus.active,
                    paymentMethodCharge: 0,
                    orderComments: orderComments,
                    totalCouponAmount: 0,
                    totalAmount: cartDetails.totalAmount,
                    orderStatusAt: null,
                };
                if (couponCode && deviceType) {
                    const query = {
                        countryId: countryData._id,
                        couponCode,
                    };
                    const couponDetails = await coupon_service_1.default.checkCouponCode({ query, user: customerId, deviceType, uuid });
                    if (couponDetails?.status && couponDetails.requestedData) {
                        cartUpdate = await checkout_service_1.default.updateCouponCodeOrder(couponDetails.requestedData, cartDetails, cartUpdate);
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: couponDetails?.message,
                        });
                    }
                }
                let shippingAddressDetails = null;
                let paymentData = null;
                let shippingChargeDetails = null;
                let totalShippingAmount = cartDetails.totalShippingAmount || 0;
                if (pickupStoreId === '' && stateId) {
                    shippingChargeDetails = await website_setup_model_1.default.findOne({ blockReference: website_setup_1.blockReferences.shipmentSettings, countryId: countryData._id });
                    if (shippingChargeDetails.blockValues) {
                        const areaWiseDeliveryChargeValues = shippingChargeDetails.blockValues.areaWiseDeliveryChargeValues || [];
                        if (areaWiseDeliveryChargeValues?.length > 0) {
                            const matchedValue = areaWiseDeliveryChargeValues.find((item) => {
                                if (item.stateId === stateId) {
                                    if (cityId) {
                                        return item.cityId === cityId;
                                    }
                                    return true;
                                }
                                return false;
                            });
                            if (matchedValue) {
                                const shippingCharge = matchedValue?.shippingCharge || 0;
                                const finalShippingCharge = Number(shippingCharge) > 0 ? ((cartDetails.totalProductAmount) - (Number(matchedValue.freeShippingThreshold)) > 0 ? 0 : shippingCharge) : 0;
                                cartUpdate = {
                                    ...cartUpdate,
                                    totalShippingAmount: finalShippingCharge,
                                    totalAmount: ((Number(cartUpdate.totalAmount) - Number(totalShippingAmount)) + Number(finalShippingCharge)),
                                };
                                totalShippingAmount = finalShippingCharge;
                            }
                        }
                    }
                }
                else if (pickupStoreId !== '') {
                    cartUpdate = {
                        ...cartUpdate,
                        totalShippingAmount: 0,
                        totalAmount: (Number(cartUpdate.totalAmount) - Number(totalShippingAmount)),
                    };
                    totalShippingAmount = 0;
                }
                else if (shippingId !== '') {
                    shippingAddressDetails = await customer_address_model_1.default.findOne({ _id: new mongoose_1.default.Types.ObjectId(shippingId) });
                    if (shippingAddressDetails && shippingAddressDetails.country !== countryData.countryTitle) {
                        shippingChargeDetails = await website_setup_model_1.default.findOne({ blockReference: website_setup_1.blockReferences.shipmentSettings, countryId: countryData._id });
                        if ((shippingChargeDetails.blockValues && shippingChargeDetails.blockValues.shippingType) && (shippingChargeDetails.blockValues.shippingType === website_setup_1.shippingTypes[2])) {
                            const { internationalShippingCharge, internationalFreeShippingThreshold } = shippingChargeDetails.blockValues || null;
                            if (internationalShippingCharge && Number(internationalShippingCharge) > 0) {
                                const finalShippingCharge = Number(internationalFreeShippingThreshold) === 0 ? Number(internationalShippingCharge) : (Number(internationalShippingCharge) > 0 ?
                                    ((Number(cartDetails.totalProductAmount) - Number(internationalFreeShippingThreshold)) > 0
                                        ? 0 : Number(internationalShippingCharge)) : 0);
                                cartUpdate = {
                                    ...cartUpdate,
                                    totalShippingAmount: finalShippingCharge,
                                    totalAmount: ((Number(cartUpdate.totalAmount) - Number(totalShippingAmount)) + Number(finalShippingCharge)),
                                };
                                totalShippingAmount = finalShippingCharge;
                            }
                        }
                    }
                }
                if ((paymentMethod.slug !== cart_1.paymentMethods.cashOnDelivery && paymentMethod.slug !== cart_1.paymentMethods.cardOnDelivery)) {
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
                                return controller.sendErrorResponse(res, 200, { message: 'Something went wrong, Payment transaction is failed. Please try again' });
                            }
                            paymentData = { paymentRedirectionUrl: tapResponse.transaction.url };
                        }
                    }
                    else if (paymentMethod && (paymentMethod.slug == cart_1.paymentMethods.tamara || paymentMethod.slug == cart_1.paymentMethods.tabby)) {
                        if (paymentMethod.paymentMethodValues) {
                            if (!shippingAddressDetails && shippingId) {
                                shippingAddressDetails = await customer_address_model_1.default.findById(shippingId);
                            }
                            let setPaymentDefualtValues = {
                                ...cartUpdate,
                                _id: cartDetails._id,
                                orderComments: cartDetails.orderComments,
                                cartStatusAt: cartDetails.cartStatusAt,
                                totalDiscountAmount: cartDetails.totalDiscountAmount,
                                totalShippingAmount: totalShippingAmount,
                                totalTaxAmount: cartDetails.totalTaxAmount,
                                products: cartDetails?.products
                            };
                            if (paymentMethod.slug == cart_1.paymentMethods.tamara) {
                                let billingAddressDetails = null;
                                if (billingId) {
                                    billingAddressDetails = await customer_address_model_1.default.findById(billingId);
                                }
                                const tamaraDefaultValues = (0, cart_utils_1.tamaraPaymentGatwayDefaultValues)(countryData, setPaymentDefualtValues, customerDetails, shippingAddressDetails, billingAddressDetails);
                                const tamaraResponse = await (0, tamara_payments_1.tamaraCheckout)(tamaraDefaultValues, paymentMethod.paymentMethodValues);
                                if (!tamaraResponse) {
                                    return controller.sendErrorResponse(res, 200, { message: 'Something went wrong, Payment transaction is failed. Please try again' });
                                }
                                if (tamaraResponse.order_id && tamaraResponse.checkout_url) {
                                    const paymentTransaction = await payment_transaction_model_1.default.create({
                                        paymentMethodId,
                                        transactionId: tamaraResponse.order_id,
                                        paymentId: tamaraResponse.checkout_id,
                                        orderId: cartDetails._id,
                                        data: tamaraResponse,
                                        orderStatus: cart_1.orderPaymentStatus.pending, // Pending
                                        createdAt: new Date(),
                                    });
                                    if (!paymentTransaction) {
                                        return controller.sendErrorResponse(res, 200, { message: 'Something went wrong, Payment transaction is failed. Please try again' });
                                    }
                                    paymentData = {
                                        paymentRedirectionUrl: tamaraResponse.checkout_url
                                    };
                                }
                                else {
                                    return controller.sendErrorResponse(res, 200, { message: 'Something went wrong, Payment transaction is failed. Please try again' });
                                }
                            }
                            else if (paymentMethod.slug == cart_1.paymentMethods.tabby) {
                                const totalCustomerBuyedCount = await cart_order_model_1.default.countDocuments({
                                    customerId: customerId,
                                    cartStatus: { $ne: cart_1.cartStatus.active },
                                    paymentMethodId: paymentMethod._id,
                                });
                                setPaymentDefualtValues = {
                                    ...setPaymentDefualtValues,
                                    totalCustomerBuyedCount
                                };
                                const tabbyDefaultValues = (0, cart_utils_1.tabbyPaymentGatwayDefaultValues)(countryData, setPaymentDefualtValues, customerDetails, paymentMethod, shippingAddressDetails);
                                const tabbyResponse = await (0, tabby_payment_1.tabbyPaymentCreate)(tabbyDefaultValues, paymentMethod.paymentMethodValues);
                                if (tabbyResponse && tabbyResponse.payment) {
                                    const paymentTransaction = await payment_transaction_model_1.default.create({
                                        paymentMethodId,
                                        transactionId: tabbyResponse.id,
                                        paymentId: tabbyResponse.payment.id,
                                        orderId: cartDetails._id,
                                        data: tabbyResponse,
                                        orderStatus: cart_1.orderPaymentStatus.pending, // Pending
                                        createdAt: new Date(),
                                    });
                                    if (!paymentTransaction) {
                                        return controller.sendErrorResponse(res, 200, { message: 'Something went wrong, Payment transaction is failed. Please try again' });
                                    }
                                }
                                else {
                                    return controller.sendErrorResponse(res, 200, { message: 'Something went wrong, Payment transaction is failed. Please try again' });
                                }
                                if (tabbyResponse && tabbyResponse.configuration && tabbyResponse.configuration.available_products && tabbyResponse.configuration.available_products.installments?.length > 0) {
                                    paymentData = {
                                        transactionId: tabbyResponse.id,
                                        ...tabbyResponse.configuration.available_products
                                    };
                                }
                            }
                        }
                        else {
                            return controller.sendErrorResponse(res, 200, { message: 'Payment method values is incorrect. Please connect with cutomer care or try another payment methods' });
                        }
                    }
                    else if (paymentMethod && paymentMethod.slug == cart_1.paymentMethods.network) {
                        if (paymentMethod.paymentMethodValues) {
                            const networkResponse = await (0, network_payments_1.networkAccessToken)(paymentMethod.paymentMethodValues);
                            if (networkResponse && networkResponse.access_token) {
                                const networkDefaultValues = (0, cart_utils_1.networkPaymentGatwayDefaultValues)(countryData, {
                                    ...cartUpdate,
                                    _id: cartDetails._id,
                                    orderComments: cartDetails.orderComments,
                                    cartStatusAt: cartDetails.cartStatusAt,
                                    totalDiscountAmount: cartDetails.totalDiscountAmount,
                                    totalShippingAmount: totalShippingAmount,
                                    totalTaxAmount: cartDetails.totalTaxAmount,
                                    products: cartDetails?.products
                                }, customerDetails);
                                const networkResult = await (0, network_payments_1.networkCreateOrder)(networkDefaultValues, networkResponse.access_token, paymentMethod.paymentMethodValues);
                                if (networkResult && networkResult._links && networkResult._links.payment) {
                                    const paymentTransaction = await payment_transaction_model_1.default.create({
                                        paymentMethodId,
                                        transactionId: networkResult._id,
                                        paymentId: networkResult.reference,
                                        orderId: cartDetails._id,
                                        data: networkResult,
                                        orderStatus: networkResult.pending, // Pending
                                        createdAt: new Date(),
                                    });
                                    if (!paymentTransaction) {
                                        return controller.sendErrorResponse(res, 200, { message: 'Something went wrong, Payment transaction is failed. Please try again' });
                                    }
                                    paymentData = { paymentRedirectionUrl: networkResult._links.payment?.href };
                                }
                                else {
                                    return controller.sendErrorResponse(res, 200, { message: 'Something went wrong, Payment transaction is failed. Please try again' });
                                }
                            }
                            else {
                                return controller.sendErrorResponse(res, 200, { message: 'Something went wrong, Payment transaction is failed. Please try again' });
                            }
                            if (networkResponse && networkResponse.configuration && networkResponse.configuration.available_products && networkResponse.configuration.available_products.installments?.length > 0) {
                                paymentData = {
                                    transactionId: networkResponse.id,
                                    ...networkResponse.configuration.available_products
                                };
                            }
                        }
                        else {
                            return controller.sendErrorResponse(res, 200, { message: 'Payment method values is incorrect. Please connect with cutomer care or try another payment methods' });
                        }
                    }
                }
                else {
                    const codAmount = await website_setup_model_1.default.findOne({ blockReference: website_setup_1.blockReferences.defualtSettings, countryId: cartDetails.countryId });
                    cartUpdate = {
                        ...cartUpdate,
                        totalAmount: (cartUpdate.totalAmount + Number(codAmount?.blockValues?.codCharge || 0)),
                        paymentMethodCharge: codAmount?.blockValues?.codCharge || 0,
                        cartStatus: "2",
                        orderStatus: cart_1.orderStatusMap['1'].value,
                        isGuest: customerDetails.isGuest ?? false,
                        orderStatusAt: new Date(),
                    };
                }
                const updateCart = await cart_order_model_1.default.findByIdAndUpdate(cartDetails._id, cartUpdate, { new: true, useFindAndModify: false });
                if (!updateCart) {
                    return controller.sendErrorResponse(res, 200, { message: 'Something went wrong, Cart updation is failed. Please try again' });
                }
                if (paymentMethod && (paymentMethod.slug == cart_1.paymentMethods.cashOnDelivery || paymentMethod.slug == cart_1.paymentMethods.cardOnDelivery)) {
                    await checkout_service_1.default.cartUpdation({ ...updateCart.toObject(), products: cartDetails.products, customerDetails, paymentMethod, shippingChargeDetails, shippingAddressDetails, countryData }, true);
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
            const paymentDetails = await payment_transaction_model_1.default.findOne({ transactionId: tabbyId });
            if (!paymentDetails) {
                return controller.sendErrorResponse(res, 200, { message: 'Payment details not found' });
            }
            let countryData = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'), true);
            if (!countryData) {
                return controller.sendErrorResponse(res, 200, { message: 'Country is missing' });
            }
            const paymentMethod = await payment_methods_model_1.default.findOne({ slug: cart_1.paymentMethods.tabby, countryId: countryData._id });
            if (!paymentMethod) {
                return controller.sendErrorResponse(res, 200, { message: 'Something went wrong, payment method is not found' });
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
            res.redirect(`${process.env.APPURL}/order-response?status=failure`); // failure
            return false;
        }
        const paymentDetails = await payment_transaction_model_1.default.findOne({ transactionId: tap_id });
        if (!paymentDetails) {
            res.redirect(`${process.env.APPURL}/order-response?status=failure&message=Payment transaction. Please contact administrator`); // failure
        }
        const paymentMethod = await payment_methods_model_1.default.findOne({ _id: paymentDetails?.paymentMethodId });
        if (!paymentMethod) {
            res.redirect(`${process.env.APPURL}/order-response?status=failure&message=Payment method not found. Please contact administrator`); // failure
        }
        const tapResponse = await (0, tap_payment_1.tapPaymentRetrieve)(tap_id, paymentMethod.paymentMethodValues);
        await payment_transaction_model_1.default.findByIdAndUpdate(paymentDetails._id, {
            $set: {
                data: tapResponse,
                status: (tapResponse.status === cart_1.tapPaymentGatwayStatus.authorized || tapResponse.status === cart_1.tapPaymentGatwayStatus.captured) ?
                    cart_1.orderPaymentStatus.success : ((tapResponse.status === cart_1.tapPaymentGatwayStatus.cancelled) ? tapResponse.cancelled : cart_1.orderPaymentStatus.failure)
            }
        }, { new: true, runValidators: true });
        if (tapResponse.status) {
            const retValResponse = await checkout_service_1.default.paymentResponse({
                paymentDetails,
                allPaymentResponseData: data,
                paymentStatus: (tapResponse.status === cart_1.tapPaymentGatwayStatus.authorized || tapResponse.status === cart_1.tapPaymentGatwayStatus.captured) ?
                    cart_1.orderPaymentStatus.success : ((tapResponse.status === cart_1.tapPaymentGatwayStatus.cancelled) ? tapResponse.cancelled : cart_1.orderPaymentStatus.failure)
            });
            if (retValResponse.status) {
                res.redirect(`${process.env.APPURL}/order-response/${retValResponse?._id}?status=success`); // success
                return true;
            }
            else {
                res.redirect(`${process.env.APPURL}/order-response/${retValResponse?._id}?status=${tapResponse?.status}`); // failure
                return false;
            }
        }
        else {
            res.redirect(`${process.env.APPURL}/order-response/${paymentDetails?.orderId}?status=${tapResponse?.status}`); // failure
            return false;
        }
    }
    async networkPaymentResponse(req, res) {
        const { ref, data } = req.query;
        if (!ref) {
            res.redirect(`${process.env.APPURL}/order-response?status=failure`); // failure
            return false;
        }
        const paymentDetails = await payment_transaction_model_1.default.findOne({ paymentId: ref });
        if (!paymentDetails) {
            res.redirect(`${process.env.APPURL}/order-response?status=failure&message=Payment transaction. Please contact administrator`); // failure
        }
        const paymentMethod = await payment_methods_model_1.default.findOne({ _id: paymentDetails?.paymentMethodId });
        if (!paymentMethod) {
            res.redirect(`${process.env.APPURL}/order-response?status=failure&message=Payment method not found. Please contact administrator`); // failure
        }
        const networkAccesTokenResponse = await (0, network_payments_1.networkAccessToken)(paymentMethod.paymentMethodValues);
        if (networkAccesTokenResponse && networkAccesTokenResponse.access_token) {
            const networkResponse = await (0, network_payments_1.networkCreateOrderStatus)(networkAccesTokenResponse.access_token, paymentMethod.paymentMethodValues, ref);
            if (!networkResponse) {
                res.redirect(`${process.env.APPURL}/order-response/${paymentMethod?.orderId}?status=failure&message=Something went wrong on payment transaction. Please contact administrator`); // failure
                return false;
            }
            const status = networkResponse._embedded.payment[0].state;
            await payment_transaction_model_1.default.findByIdAndUpdate(paymentDetails._id, {
                $set: {
                    data: networkResponse,
                    status: (status !== cart_1.networkPaymentGatwayStatus.failed) ?
                        cart_1.orderPaymentStatus.success : ((status === cart_1.networkPaymentGatwayStatus.failed) ? cart_1.orderPaymentStatus.failure : cart_1.orderPaymentStatus.failure)
                }
            }, { new: true, runValidators: true });
            if (networkResponse._embedded && networkResponse._embedded.payment && networkResponse._embedded.payment.length > 0 && networkResponse._embedded.payment[0].state) {
                const retValResponse = await checkout_service_1.default.paymentResponse({
                    paymentDetails,
                    allPaymentResponseData: data,
                    paymentStatus: (status !== cart_1.networkPaymentGatwayStatus.failed) ?
                        cart_1.orderPaymentStatus.success : ((status === cart_1.networkPaymentGatwayStatus.failed) ? cart_1.orderPaymentStatus.failure : cart_1.orderPaymentStatus.failure)
                });
                if (retValResponse.status) {
                    res.redirect(`${process.env.APPURL}/order-response/${retValResponse?._id}?status=success`); // success
                    return true;
                }
                else {
                    res.redirect(`${process.env.APPURL}/order-response/${retValResponse?._id}?status=${status}`); // failure
                    return false;
                }
            }
            else {
                res.redirect(`${process.env.APPURL}/order-response/${paymentMethod?.orderId}?status=failure&message=Something went wrong on payment transaction. Please contact administrator`); // failure
                return false;
            }
        }
        else {
            res.redirect(`${process.env.APPURL}/order-response/${paymentDetails?.orderId}?status=failure&message=Payment transaction. Please contact administrator`); // failure
            return false;
        }
    }
    async tabbySuccessResponse(req, res) {
        const { payment_id } = req.query;
        if (!payment_id) {
            res.redirect(`${process.env.APPURL}/order-response?status=failure`); // failure
            return false;
        }
        const paymentDetails = await payment_transaction_model_1.default.findOne({ paymentId: payment_id });
        if (!paymentDetails) {
            res.redirect(`${process.env.APPURL}/order-response?status=failure&message=Payment transaction. Please contact administrator`); // failure
        }
        const paymentMethod = await payment_methods_model_1.default.findOne({ _id: paymentDetails?.paymentMethodId });
        if (!paymentMethod) {
            res.redirect(`${process.env.APPURL}/order-response?status=failure&message=Payment method not found. Please contact administrator`); // failure
        }
        const tabbyResponse = await (0, tabby_payment_1.tabbyPaymentRetrieve)(payment_id, paymentMethod.paymentMethodValues);
        await payment_transaction_model_1.default.findByIdAndUpdate(paymentDetails._id, {
            $set: {
                data: tabbyResponse,
                status: (tabbyResponse.status === cart_1.tabbyPaymentGatwaySuccessStatus.authorized || tabbyResponse.status === cart_1.tabbyPaymentGatwaySuccessStatus.closed) ?
                    cart_1.orderPaymentStatus.success : ((tabbyResponse.status === cart_1.tabbyPaymentGatwaySuccessStatus.rejected) ? cart_1.orderPaymentStatus.cancelled : cart_1.orderPaymentStatus.expired)
            }
        }, { new: true, runValidators: true });
        if (tabbyResponse.status) {
            const retValResponse = await checkout_service_1.default.paymentResponse({
                paymentDetails,
                allPaymentResponseData: tabbyResponse,
                paymentStatus: (tabbyResponse.status === cart_1.tabbyPaymentGatwaySuccessStatus.authorized || tabbyResponse.status === cart_1.tabbyPaymentGatwaySuccessStatus.closed) ?
                    cart_1.orderPaymentStatus.success : ((tabbyResponse.status === cart_1.tabbyPaymentGatwaySuccessStatus.rejected) ? cart_1.orderPaymentStatus.cancelled : cart_1.orderPaymentStatus.expired)
            });
            if (retValResponse.status) {
                res.redirect(`${process.env.APPURL}/order-response/${retValResponse?._id}?status=success`); // success
                return true;
            }
            else {
                res.redirect(`${process.env.APPURL}/order-response/${retValResponse?._id}?status=${tabbyResponse?.status}`); // failure
                return false;
            }
        }
        else {
            res.redirect(`${process.env.APPURL}/order-response/${paymentDetails?.orderId}?status=${tabbyResponse?.status}`); // failure
            return false;
        }
    }
    async tabbyPaymentCapture(req, res) {
        const validatedData = checkout_schema_1.tabbyPaymentCaptureSchema.safeParse(req.body);
        if (validatedData.success) {
            const { id, status, order } = validatedData.data;
            let paymentDetails = await payment_transaction_model_1.default.findOne({ paymentId: id });
            if (!paymentDetails) {
                paymentDetails = await payment_transaction_model_1.default.findOne({ orderId: new mongoose_1.default.Types.ObjectId(order.reference_id) });
                if (!paymentDetails) {
                    return controller.sendErrorResponse(res, 200, { message: `Payment ${status ?? 'failure'}` });
                }
            }
            if (cart_1.tabbyPaymentGatwaySuccessStatus.authorized.toLocaleLowerCase() === status.toLocaleLowerCase()) {
                const retValResponse = await checkout_service_1.default.paymentResponse({
                    paymentDetails,
                    allPaymentResponseData: req.body,
                    paymentStatus: (status === cart_1.tabbyPaymentGatwaySuccessStatus.authorized || status === cart_1.tabbyPaymentGatwaySuccessStatus.closed) ?
                        cart_1.orderPaymentStatus.success : ((status === cart_1.tabbyPaymentGatwaySuccessStatus.rejected) ? cart_1.orderPaymentStatus.cancelled : cart_1.orderPaymentStatus.expired)
                });
                if (retValResponse.status) {
                    return controller.sendSuccessResponse(res, {
                        message: retValResponse.message || `Payment ${status}`
                    }, 200);
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: retValResponse.message || `Payment ${status}`
                    });
                }
            }
            else {
                await payment_transaction_model_1.default.findByIdAndUpdate(paymentDetails._id, { $set: { data: req.body } }, { new: true, runValidators: true });
                return controller.sendErrorResponse(res, 200, {
                    message: `Payment ${status}`
                });
            }
        }
        else {
            return controller.sendErrorResponse(res, 200, {
                message: 'Validation error',
                validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
            });
        }
    }
    async tamaraSuccessResponse(req, res) {
        const { orderId, paymentStatus } = req.query;
        if (!orderId) {
            res.redirect(`${process.env.APPURL}/order-response?status=${paymentStatus || 'failure'}`); // failure
            return false;
        }
        const paymentDetails = await payment_transaction_model_1.default.findOne({ transactionId: orderId });
        if (!paymentDetails) {
            res.redirect(`${process.env.APPURL}/order-response?status=${paymentStatus || 'failure'}&message=Payment transaction. Please contact administrator`); // failure
        }
        const paymentMethod = await payment_methods_model_1.default.findOne({ _id: paymentDetails?.paymentMethodId }).select('_id paymentMethodValues');
        if (!paymentMethod) {
            res.redirect(`${process.env.APPURL}/order-response?status=${paymentStatus || 'failure'}&message=Payment method not found. Please contact administrator`); // failure
        }
        const tamaraResponse = await (0, tamara_payments_1.tamaraAutoriseOrder)(orderId, paymentMethod.paymentMethodValues);
        if (!tamaraResponse) {
            res.redirect(`${process.env.APPURL}/order-response?status=${paymentStatus || 'failure'}&message=Tamara autorise not completed. Please contact administrator`); // failure
        }
        await payment_transaction_model_1.default.findByIdAndUpdate(paymentDetails._id, {
            $set: {
                data: tamaraResponse,
                status: (tamaraResponse.status === cart_1.tamaraPaymentGatwayStatus.authorised || tamaraResponse.status === cart_1.tamaraPaymentGatwayStatus.approved) ?
                    cart_1.orderPaymentStatus.success : ((tamaraResponse.status === cart_1.tamaraPaymentGatwayStatus.declined) ? cart_1.orderPaymentStatus.cancelled : cart_1.orderPaymentStatus.expired)
            }
        }, { new: true, runValidators: true });
        if (tamaraResponse.status === cart_1.tamaraPaymentGatwayStatus.authorised) {
            const retValResponse = await checkout_service_1.default.paymentResponse({
                paymentDetails,
                allPaymentResponseData: tamaraResponse,
                paymentStatus: (tamaraResponse.status === cart_1.tamaraPaymentGatwayStatus.authorised || tamaraResponse.status === cart_1.tamaraPaymentGatwayStatus.approved) ?
                    cart_1.orderPaymentStatus.success : ((tamaraResponse.status === cart_1.tamaraPaymentGatwayStatus.declined) ? cart_1.orderPaymentStatus.cancelled : cart_1.orderPaymentStatus.expired)
            });
            if (retValResponse.status) {
                res.redirect(`${process.env.APPURL}/order-response/${retValResponse?._id}?status=success`); // success
                return true;
            }
            else {
                res.redirect(`${process.env.APPURL}/order-response/${retValResponse?._id}?status=${paymentStatus}`); // failure
                return false;
            }
        }
        else {
            res.redirect(`${process.env.APPURL}/order-response/${paymentDetails?.orderId}?status=${paymentStatus}`); // failure
            return false;
        }
    }
}
exports.default = new CheckoutController();

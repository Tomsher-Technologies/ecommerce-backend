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
const product_category_link_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-category-link-model"));
const product_model_1 = __importDefault(require("../../../model/admin/ecommerce/product-model"));
const tap_payment_1 = require("../../../lib/tap-payment");
const customers_model_1 = __importDefault(require("../../../model/frontend/customers-model"));
const cart_utils_1 = require("../../../utils/frontend/cart-utils");
const payment_transaction_model_1 = __importDefault(require("../../../model/frontend/payment-transaction-model"));
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
                const cart = await cart_service_1.default.findCartPopulate({
                    query: {
                        $and: [
                            { customerId: customerId },
                            { countryId: countryData._id },
                            { cartStatus: "1" }
                        ],
                    },
                    hostName: req.get('origin'),
                });
                if (!cart) {
                    return controller.sendErrorResponse(res, 500, { message: 'Cart not found!' });
                }
                let couponAmountTotal = 0;
                let productId;
                let cartUpdate = {
                    paymentMethodCharge: 0,
                    couponId: null,
                    totalCouponAmount: couponAmountTotal,
                    totalAmount: cart.totalAmount,
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
                        const cartProductDetails = await cart_service_1.default.findAllCart({ cartId: cart._id });
                        const productIds = cartProductDetails.map((product) => product.productId.toString());
                        const discountedAmountByPercentage = (couponDetails?.requestedData.discountAmount) / 100 * cart.totalAmount;
                        const couponPercentage = Math.min(discountedAmountByPercentage, couponDetails?.requestedData.discountMaxRedeemAmount);
                        const couponAmount = couponDetails?.requestedData.discountAmount;
                        const updateTotalCouponAmount = (product) => {
                            if (product) {
                                couponAmountTotal = product.productAmount - couponAmount;
                                productId = product.productId;
                            }
                        };
                        if (couponDetails?.requestedData.couponType == cart_1.couponTypes.entireOrders) {
                            if (couponDetails?.requestedData.discountType == cart_1.couponDiscountType.amount) {
                                couponAmountTotal = couponAmount;
                            }
                            if (couponDetails?.requestedData.discountType == cart_1.couponDiscountType.percentage) {
                                couponAmountTotal = couponPercentage;
                            }
                        }
                        else if (couponDetails?.requestedData.couponType == cart_1.couponTypes.forProduct) {
                            if (couponDetails?.requestedData.discountType == cart_1.couponDiscountType.amount) {
                                // couponAmountTotal = couponAmount
                                const updatedCartProductDetails = cartProductDetails.map(async (product) => {
                                    if (couponDetails?.requestedData.couponApplyValues.includes((product.productId.toString()))) {
                                        updateTotalCouponAmount(product);
                                    }
                                });
                            }
                            if (couponDetails?.requestedData.discountType == cart_1.couponDiscountType.percentage) {
                                const updatedCartProductDetails = cartProductDetails.map(async (product) => {
                                    if (couponDetails?.requestedData.couponApplyValues.includes((product.productId.toString()))) {
                                        updateTotalCouponAmount(product);
                                    }
                                });
                            }
                        }
                        else if (couponDetails?.requestedData.couponType == cart_1.couponTypes.forCategory) {
                            const productCategoryDetails = await product_category_link_model_1.default.find({ productId: { $in: productIds } });
                            const categoryIds = productCategoryDetails.map((product) => product.categoryId.toString());
                            if (couponDetails?.requestedData.discountType == cart_1.couponDiscountType.amount) {
                                const updatedCartProductDetails = categoryIds.map(async (product) => {
                                    if (couponDetails?.requestedData.couponApplyValues.includes((product.productId.toString()))) {
                                        updateTotalCouponAmount(product);
                                    }
                                });
                            }
                            if (couponDetails?.requestedData.discountType == cart_1.couponDiscountType.percentage) {
                                const updatedCartProductDetails = categoryIds.map(async (product) => {
                                    if (couponDetails?.requestedData.couponApplyValues.includes((product.productId.toString()))) {
                                        updateTotalCouponAmount(product);
                                    }
                                });
                            }
                        }
                        else if (couponDetails?.requestedData.couponType == cart_1.couponTypes.forBrand) {
                            const productDetails = await product_model_1.default.find({ _id: { $in: productIds } });
                            const brandIds = productDetails.map((product) => product.brand.toString());
                            if (couponDetails?.requestedData.discountType == cart_1.couponDiscountType.amount) {
                                const updatedCartProductDetails = brandIds.map(async (product) => {
                                    if (couponDetails?.requestedData.couponApplyValues.includes((product.productId.toString()))) {
                                        updateTotalCouponAmount(product);
                                    }
                                });
                            }
                            if (couponDetails?.requestedData.discountType == cart_1.couponDiscountType.percentage) {
                                const updatedCartProductDetails = brandIds.map(async (product) => {
                                    if (couponDetails?.requestedData.couponApplyValues.includes((product.productId.toString()))) {
                                        updateTotalCouponAmount(product);
                                    }
                                });
                            }
                        }
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: couponDetails?.message,
                        });
                    }
                }
                cartUpdate = {
                    ...cartUpdate,
                    totalCouponAmount: couponAmountTotal,
                    totalAmount: cart.totalAmount - couponAmountTotal,
                };
                if (paymentMethod.slug !== cart_1.paymentMethods.cashOnDelivery) {
                    if (paymentMethod && paymentMethod.slug == cart_1.paymentMethods.tap) {
                        const tapDefaultValues = (0, cart_utils_1.tapPaymentGatwayDefaultValues)(countryData, { ...cartUpdate, _id: cart._id }, customerDetails);
                        const tapResponse = await (0, tap_payment_1.tapPayment)(tapDefaultValues);
                        console.log("cartUpdatecartUpdate", tapResponse);
                    }
                    else if (paymentMethod && paymentMethod.slug == cart_1.paymentMethods.tabby) {
                    }
                }
                else {
                    const codAmount = await website_setup_model_1.default.findOne({ blockReference: website_setup_1.blockReferences.defualtSettings });
                    cartUpdate = {
                        ...cartUpdate,
                        paymentMethodCharge: codAmount.blockValues.codCharge
                    };
                }
                // if (couponCode) {
                //     const updateCartProduct = await CartService.updateCartProduct(productId, { productAmount: couponAmountTotal })
                // }
                const updateCart = await cart_service_1.default.update(cart._id, cartUpdate);
                return controller.sendErrorResponse(res, 200, {
                    message: 'Some error occurred while Checkout',
                });
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
        console.log('here');
        await payment_transaction_model_1.default.create({
            data: JSON.stringify(req.query),
            status: '1',
            createdAt: new Date(),
        });
        res.redirect("http://stackoverflow.com");
    }
}
exports.default = new CheckoutController();

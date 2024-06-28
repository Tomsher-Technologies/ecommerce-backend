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
const controller = new base_controller_1.default();
class CheckoutController extends base_controller_1.default {
    async checkout(req, res) {
        try {
            const customerId = res.locals.user;
            let countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (!countryId) {
                return controller.sendErrorResponse(res, 500, { message: 'Country is missing' });
            }
            const validatedData = checkout_schema_1.checkoutSchema.safeParse(req.body);
            if (validatedData.success) {
                const { deviceType, couponCode, paymentMethodId, shippingId, billingId } = validatedData.data;
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
                if (!cart) {
                    return controller.sendErrorResponse(res, 500, { message: 'Cart not found!' });
                }
                let couponId;
                let couponAmountTotal;
                let productId;
                if (couponCode && deviceType) {
                    const query = {
                        countryId,
                        couponCode,
                    };
                    const couponDetails = await coupon_service_1.default.checkCouponCode({ query, user: customerId, deviceType });
                    console.log("couponDetails", couponDetails);
                    if (couponDetails?.status) {
                        couponId = couponDetails?.requestedData._id;
                        const cartProductDetails = await cart_service_1.default.findAllCart({ cartId: cart._id });
                        const productIds = cartProductDetails.map((product) => product.productId.toString());
                        const discountedAmount = (couponDetails?.requestedData.discountAmount) / 100 * cart.totalAmount;
                        const couponPercentage = Math.min(discountedAmount, couponDetails?.requestedData.discountMaxRedeemAmount);
                        const couponAmount = couponDetails?.requestedData.discountAmount;
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
                                        couponAmountTotal = product.productAmount - couponAmount;
                                        productId = product.productId;
                                    }
                                });
                            }
                            if (couponDetails?.requestedData.discountType == cart_1.couponDiscountType.percentage) {
                                const updatedCartProductDetails = cartProductDetails.map(async (product) => {
                                    if (couponDetails?.requestedData.couponApplyValues.includes((product.productId.toString()))) {
                                        couponAmountTotal = product.productAmount - couponAmount;
                                        // const updateCartProduct = await CartService.updateCartProduct(product._id, { productAmount: product.productAmount })
                                        productId = product.productId;
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
                                        couponAmountTotal = product.productAmount - couponAmount;
                                        productId = product.productId;
                                    }
                                });
                            }
                            if (couponDetails?.requestedData.discountType == cart_1.couponDiscountType.percentage) {
                                const updatedCartProductDetails = categoryIds.map(async (product) => {
                                    if (couponDetails?.requestedData.couponApplyValues.includes((product.productId.toString()))) {
                                        couponAmountTotal = product.productAmount - couponAmount;
                                        productId = product.productId;
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
                                        couponAmountTotal = product.productAmount - couponAmount;
                                        productId = product.productId;
                                    }
                                });
                            }
                            if (couponDetails?.requestedData.discountType == cart_1.couponDiscountType.percentage) {
                                const updatedCartProductDetails = brandIds.map(async (product) => {
                                    if (couponDetails?.requestedData.couponApplyValues.includes((product.productId.toString()))) {
                                        couponAmountTotal = product.productAmount - couponAmount;
                                        productId = product.productId;
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
                if (shippingId) {
                }
                let cartUpdate = {
                    paymentMethodCharge: 0,
                    couponId: couponId,
                    totalCouponAmount: couponAmountTotal,
                    totalAmount: cart.totalAmount - couponAmountTotal,
                    shippingId: shippingId,
                    billingId: billingId
                };
                console.log("cartUpdatecartUpdate", cartUpdate);
                const paymentMethod = await payment_methods_model_1.default.findOne({ _id: paymentMethodId });
                if (paymentMethod && paymentMethod.slug == cart_1.paymentMethods.cashOnDelivery) {
                    const codAmount = await website_setup_model_1.default.findOne({ blockReference: website_setup_1.blockReferences.defualtSettings });
                    cartUpdate = {
                        ...cartUpdate,
                        paymentMethodCharge: codAmount.blockValues.codCharge
                    };
                }
                else if (paymentMethod && paymentMethod.slug == cart_1.paymentMethods.tap) {
                    // const response = await axios.post(tapApiUrl, {
                    //     amount :cartUpdate.totalAmount,
                    //     currency,
                    //     source: {
                    //         id: token, // Token obtained from Tap Payments SDK or Payment Form
                    //         type: 'token',
                    //     },
                    // }, {
                    //     headers: {
                    //         'Authorization': `Bearer ${tapApiKey}`,
                    //         'Content-Type': 'application/json',
                    //     },
                    // });
                }
                else if (paymentMethod && paymentMethod.slug == cart_1.paymentMethods.tabby) {
                }
                if (couponCode) {
                    const updateCartProduct = await cart_service_1.default.updateCartProduct(productId, { productAmount: couponAmountTotal });
                }
                const updateCart = await cart_service_1.default.update(cart._id, cartUpdate);
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
}
exports.default = new CheckoutController();

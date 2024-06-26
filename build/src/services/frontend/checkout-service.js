"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cart_1 = require("../../constants/cart");
const helpers_1 = require("../../utils/helpers");
const coupon_service_1 = __importDefault(require("./auth/coupon-service"));
const cart_service_1 = __importDefault(require("./cart-service"));
const product_model_1 = __importDefault(require("../../model/admin/ecommerce/product-model"));
const product_category_link_model_1 = __importDefault(require("../../model/admin/ecommerce/product/product-category-link-model"));
const cart_order_model_1 = __importDefault(require("../../model/frontend/cart-order-model"));
const payment_transaction_model_1 = __importDefault(require("../../model/frontend/payment-transaction-model"));
class CheckoutService {
    async paymentResponse(options = {}) {
        const { transactionId, allPaymentResponseData, paymentStatus } = options;
        const paymentDetails = await payment_transaction_model_1.default.findOne({ transactionId });
        if (!paymentDetails) {
            return {
                status: false,
                message: 'Payment transactions not found'
            };
        }
        const cartDetails = await cart_order_model_1.default.findOne({ _id: paymentDetails?.orderId, cartStatus: "1" });
        if (!cartDetails) {
            const cartUpdation = this.cartUpdation(cartDetails, false);
            return {
                orderId: null,
                status: false,
                message: 'Active cart not found'
            };
        }
        if (paymentStatus === cart_1.orderPaymentStatus.success) {
            const updateTransaction = await payment_transaction_model_1.default.findByIdAndUpdate(paymentDetails?._id, {
                data: JSON.stringify(allPaymentResponseData),
                status: paymentStatus,
                createdAt: new Date(),
            }, { new: true, useFindAndModify: false });
            this.cartUpdation(cartDetails, true);
            if (updateTransaction) {
                return {
                    orderId: cartDetails._id,
                    status: true,
                    message: 'Payment success'
                };
            }
            else {
                return {
                    orderId: cartDetails._id,
                    status: false,
                    message: 'update transaction is fail please contact administrator'
                };
            }
        }
        else {
            const updateTransaction = await payment_transaction_model_1.default.findByIdAndUpdate(paymentDetails?._id, {
                data: JSON.stringify(allPaymentResponseData),
                status: paymentStatus,
                createdAt: new Date(),
            }, { new: true, useFindAndModify: false });
            this.cartUpdation(cartDetails, false);
            return {
                orderId: cartDetails._id,
                status: false,
                message: paymentStatus
            };
        }
    }
    async cartUpdation(cartDetails, paymentSuccess) {
        if (cartDetails) {
            let cartUpdate = {
                cartStatus: cart_1.cartStatus.active,
                totalAmount: cartDetails?.totalAmount,
                totalCouponAmount: 0,
                couponId: cartDetails?.couponId
            };
            if (!paymentSuccess) {
                cartUpdate = {
                    ...cartUpdate,
                    couponId: null
                };
            }
            else {
                const couponDetails = await coupon_service_1.default.findOne({ _id: cartDetails?.couponId });
                if (couponDetails) {
                    const cartProductDetails = await cart_service_1.default.findAllCart({ cartId: cartDetails?._id });
                    const productIds = cartProductDetails.map((product) => product.productId.toString());
                    const couponAmount = couponDetails?.requestedData?.discountAmount;
                    const discountType = couponDetails?.requestedData?.discountType;
                    const updateTotalCouponAmount = (productAmount, discountAmount, discountType) => {
                        if (productAmount) {
                            const totalCouponAmount = (0, helpers_1.calculateTotalDiscountAmountDifference)(productAmount, discountType, discountAmount);
                            const cartTtotalAmount = cartDetails?.totalAmount - (0, helpers_1.calculateTotalDiscountAmountDifference)(productAmount, discountType, discountAmount);
                            cartUpdate = {
                                ...cartUpdate,
                                totalAmount: cartTtotalAmount,
                                totalCouponAmount: totalCouponAmount
                            };
                        }
                    };
                    if (couponDetails?.requestedData.couponType == cart_1.couponTypes.entireOrders) {
                        updateTotalCouponAmount(cartDetails?.totalAmount, couponAmount, discountType);
                    }
                    else if (couponDetails?.requestedData.couponType == cart_1.couponTypes.forProduct) {
                        cartProductDetails.map(async (product) => {
                            if (couponDetails?.requestedData.couponApplyValues.includes((product.productId.toString()))) {
                                updateTotalCouponAmount(product.productAmount, couponAmount, discountType);
                            }
                        });
                    }
                    else if (couponDetails?.requestedData.couponType == cart_1.couponTypes.forCategory) {
                        const productCategoryDetails = await product_category_link_model_1.default.find({ productId: { $in: productIds } });
                        const categoryIds = productCategoryDetails.map((product) => product.categoryId.toString());
                        categoryIds.map(async (product) => {
                            if (couponDetails?.requestedData.couponApplyValues.includes((product.productId.toString()))) {
                                updateTotalCouponAmount(product.productAmount, couponAmount, discountType);
                            }
                        });
                    }
                    else if (couponDetails?.requestedData.couponType == cart_1.couponTypes.forBrand) {
                        const productDetails = await product_model_1.default.find({ _id: { $in: productIds } });
                        const brandIds = productDetails.map((product) => product.brand.toString());
                        brandIds.map(async (product) => {
                            if (couponDetails?.requestedData.couponApplyValues.includes((product.productId.toString()))) {
                                updateTotalCouponAmount(product.productAmount, couponAmount, discountType);
                            }
                        });
                    }
                }
            }
            // if (cartDetails.customerId) {
            //     const walletsDetails = await settingsService.findOne({ countryId: cartDetails.countryId, block: websiteSetup.basicSettings, blockReference: blockReferences.wallets });
            //     if ((walletsDetails) && (walletsDetails.blockValues)&&(walletsDetails.blockValues.enableWallet)) {
            //         await CustomerWalletTransactionsModel.create({
            //             customerId: cartDetails.customerId,
            //             earnType: earnTypes.order,
            //             walletAmount: walletsDetails.blockValues.orderAmount,
            //             walletPoints: calculateRewardPoints(walletsDetails.blockValues, cartUpdate.totalAmount),
            //             status: '1'
            //         });
            //     }
            // }
            cartUpdate = {
                ...cartUpdate,
                cartStatus: cart_1.cartStatus.order,
                processingStatusAt: new Date(),
                orderStatusAt: new Date(),
            };
            const updateCart = await cart_service_1.default.update(cartDetails?._id, cartUpdate);
            if (!updateCart) {
                return {
                    orderId: cartDetails?._id,
                    status: false,
                    message: 'Cart updation failed'
                };
            }
            else {
                return {
                    orderId: cartDetails?._id,
                    status: true,
                    message: 'Cart updation success'
                };
            }
        }
    }
}
exports.default = new CheckoutService();

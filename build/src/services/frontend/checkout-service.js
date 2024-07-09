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
        const { transactionId, paymentId, paymentMethod, allPaymentResponseData, paymentStatus } = options;
        const paymentDetails = await payment_transaction_model_1.default.findOne(paymentMethod === cart_1.paymentMethods.tabby ? { paymentId } : { transactionId });
        console.log('options', options);
        console.log('paymentDetails', paymentDetails);
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
                _id: null,
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
                    _id: cartDetails._id,
                    orderId: cartDetails.orderId,
                    status: true,
                    message: 'Payment success'
                };
            }
            else {
                return {
                    _id: cartDetails._id,
                    orderId: cartDetails.orderId,
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
                _id: cartDetails._id,
                orderId: cartDetails.orderId,
                status: false,
                message: paymentStatus
            };
        }
    }
    async getNextSequenceValue() {
        const maxOrder = await cart_order_model_1.default.find().sort({ orderId: -1 }).limit(1);
        console.log('maxOrder', maxOrder);
        if (Array.isArray(maxOrder) && maxOrder.length > 0 && maxOrder[0].orderId) {
            const maxOrderId = maxOrder[0].orderId;
            const nextOrderId = (parseInt(maxOrderId, 10) + 1).toString().padStart(6, '0');
            return nextOrderId;
        }
        else {
            return '000001';
        }
    }
    async cartUpdation(cartDetails, paymentSuccess) {
        if (cartDetails) {
            let cartUpdate = {
                cartStatus: cart_1.cartStatus.active,
                totalAmount: cartDetails?.totalAmount,
                totalCouponAmount: 0,
                couponId: cartDetails?.couponId,
                paymentMethodId: cartDetails?.paymentMethodId
            };
            if (!paymentSuccess) {
                cartUpdate = {
                    ...cartUpdate,
                    couponId: null,
                    paymentMethodId: null
                };
            }
            else {
                const couponDetails = await coupon_service_1.default.findOne({ _id: cartDetails?.couponId });
                if (couponDetails) {
                    const cartProductDetails = await cart_service_1.default.findAllCart({ cartId: cartDetails?._id });
                    const productIds = cartProductDetails.map((product) => product.productId.toString());
                    const couponAmount = couponDetails?.discountAmount;
                    const discountType = couponDetails.discountType;
                    const updateTotalCouponAmount = (productAmount, discountAmount, discountType) => {
                        if (productAmount) {
                            const totalCouponAmount = (0, helpers_1.calculateTotalDiscountAmountDifference)(productAmount, discountType, discountAmount);
                            const cartTotalAmount = cartDetails?.totalAmount - (0, helpers_1.calculateTotalDiscountAmountDifference)(productAmount, discountType, discountAmount);
                            cartUpdate = {
                                ...cartUpdate,
                                totalAmount: cartTotalAmount,
                                totalCouponAmount: totalCouponAmount
                            };
                        }
                    };
                    var totalAmount = 0;
                    if (couponDetails?.couponType == cart_1.couponTypes.entireOrders) {
                        updateTotalCouponAmount(cartDetails?.totalAmount, couponAmount, discountType);
                    }
                    else if (couponDetails?.couponType == cart_1.couponTypes.forProduct) {
                        cartProductDetails.map(async (product) => {
                            if (couponDetails?.couponApplyValues.includes((product.productId))) {
                                totalAmount += product.productAmount;
                                // updateTotalCouponAmount(product.productAmount, couponAmount, discountType)
                            }
                        });
                        updateTotalCouponAmount(totalAmount, couponAmount, discountType);
                    }
                    else if (couponDetails?.couponType == cart_1.couponTypes.forCategory) {
                        const productCategoryDetails = await product_category_link_model_1.default.find({ productId: { $in: productIds } });
                        const categoryIds = productCategoryDetails.map((product) => product.categoryId);
                        categoryIds.map(async (product) => {
                            if (couponDetails?.couponApplyValues.includes((product.productId.toString()))) {
                                totalAmount += product.productAmount;
                                // updateTotalCouponAmount(product.productAmount, couponAmount, discountType)
                            }
                        });
                        updateTotalCouponAmount(totalAmount, couponAmount, discountType);
                    }
                    else if (couponDetails?.couponType == cart_1.couponTypes.forBrand) {
                        const productDetails = await product_model_1.default.find({ _id: { $in: productIds } });
                        const brandIds = productDetails.map((product) => product.brand);
                        brandIds.map(async (product) => {
                            if (couponDetails?.couponApplyValues.includes((product.productId))) {
                                totalAmount += product.productAmount;
                                // updateTotalCouponAmount(product.productAmount, couponAmount, discountType)
                            }
                        });
                        updateTotalCouponAmount(totalAmount, couponAmount, discountType);
                    }
                }
            }
            const orderId = await this.getNextSequenceValue();
            cartUpdate = {
                ...cartUpdate,
                orderId: orderId,
                cartStatus: cart_1.cartStatus.order,
                orderStatus: cart_1.orderStatusMap['1'].value,
                processingStatusAt: new Date(),
                orderStatusAt: new Date(),
            };
            const updateCart = await cart_service_1.default.update(cartDetails?._id, cartUpdate);
            if (!updateCart) {
                return {
                    _id: cartDetails?._id,
                    orderId: orderId,
                    status: false,
                    message: 'Cart updation failed'
                };
            }
            else {
                return {
                    _id: cartDetails?._id,
                    orderId: orderId,
                    status: true,
                    message: 'Cart updation success'
                };
            }
        }
    }
}
exports.default = new CheckoutService();

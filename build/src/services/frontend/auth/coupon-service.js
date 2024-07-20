"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const cart_1 = require("../../../constants/cart");
const product_model_1 = __importDefault(require("../../../model/admin/ecommerce/product-model"));
const product_category_link_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-category-link-model"));
const coupon_model_1 = __importDefault(require("../../../model/admin/marketing/coupon-model"));
const cart_order_model_1 = __importDefault(require("../../../model/frontend/cart-order-model"));
const cart_service_1 = __importDefault(require("../../../services/frontend/cart-service"));
class CouponService {
    async findAll(options) {
        let { query } = (0, pagination_1.frontendPagination)(options.query || {}, options);
        let pipeline = [
            { $match: query },
        ];
        return coupon_model_1.default.aggregate(pipeline).exec();
    }
    async checkCouponCode(options) {
        const { query, user, deviceType } = options;
        const currentDate = new Date();
        try {
            const cartDetails = await cart_service_1.default.findOneCart({
                cartStatus: '1',
                customerId: user._id
            });
            if (!cartDetails) {
                return {
                    status: false,
                    message: 'Active cart is not found!'
                };
            }
            const couponDetails = await this.findOne({
                ...query,
                status: '1',
                $and: [
                    { "discountDateRange.0": { $lte: currentDate } },
                    { "discountDateRange.1": { $gte: currentDate } },
                ]
            });
            if (!couponDetails) {
                return {
                    status: false,
                    message: 'Coupon not found!'
                };
            }
            if (cartDetails.totalAmount < Number(couponDetails.minPurchaseValue)) {
                return {
                    status: false,
                    message: `The coupon applies with a minimum purchase of ${couponDetails.minPurchaseValue}. Your total is ${cartDetails.totalAmount}.`
                };
            }
            console.log('abcd', cartDetails.totalAmount < Number(couponDetails.minPurchaseValue));
            console.log('totalAmount', cartDetails.totalAmount);
            console.log('minPurchaseValue', Number(couponDetails.minPurchaseValue));
            // Check if the totalCouponAmount exceeds discountMaxRedeemAmount for carts with status not equal to '1'
            const totalCouponAmountResult = await cart_order_model_1.default.aggregate([
                { $match: { cartStatus: '1', customerId: user._id } },
                { $group: { _id: null, totalCouponAmount: { $sum: "$totalCouponAmount" } } }
            ]);
            const totalCouponAmount = totalCouponAmountResult[0]?.totalCouponAmount || 0;
            if (totalCouponAmount >= Number(couponDetails.discountMaxRedeemAmount)) {
                return {
                    status: false,
                    message: `The total coupon amount exceeds the maximum redeemable amount`
                };
            }
            if (![cart_1.couponTypes.entireOrders].includes(couponDetails.couponType)) {
                const cartProductDetails = await cart_service_1.default.findAllCart({ cartId: cartDetails._id });
                const productIds = cartProductDetails.map((product) => product.productId.toString());
                const applicableCouponApplyValues = couponDetails.couponApplyValues;
                if (couponDetails.couponType === cart_1.couponTypes.forProduct) {
                    if (!productIds.some((id) => applicableCouponApplyValues.includes(id))) {
                        return {
                            status: false,
                            message: "This coupon can't be used for the products in your cart!"
                        };
                    }
                }
                else if (couponDetails.couponType === cart_1.couponTypes.forBrand) {
                    const productDetails = await product_model_1.default.find({ _id: { $in: productIds } });
                    const brandIds = productDetails.map((product) => product.brand.toString());
                    if (!brandIds.some((id) => applicableCouponApplyValues.includes(id))) {
                        return {
                            status: false,
                            message: "This coupon can't be used for the brands in your cart!"
                        };
                    }
                }
                else if (couponDetails.couponType === cart_1.couponTypes.forCategory) {
                    const productCategoryDetails = await product_category_link_model_1.default.find({ productId: { $in: productIds } });
                    const categoryIds = productCategoryDetails.map((product) => product.categoryId.toString());
                    if (!categoryIds.some((id) => applicableCouponApplyValues.includes(id))) {
                        return {
                            status: false,
                            message: "This coupon can't be used for the categories in your cart!"
                        };
                    }
                }
            }
            // Check if the coupon is only for mobile app users
            if (couponDetails.couponUsage.mobileAppOnlyCoupon && deviceType !== cart_1.couponDeviceType.mobile) {
                return {
                    status: false,
                    message: 'This coupon can only be used by mobile application users!'
                };
            }
            // Check if the coupon is only for new users
            if (couponDetails.couponUsage.onlyForNewUser) {
                const checkCart = await cart_service_1.default.findOneCart({ cartStatus: { $ne: '1' }, customerId: user._id });
                if (checkCart) {
                    return {
                        status: false,
                        message: 'This coupon can only be used by new users!'
                    };
                }
            }
            // Check coupon usage limit per user
            if (couponDetails.couponUsage.enableCouponUsageLimit) {
                const usageCount = await cart_order_model_1.default.countDocuments({
                    customerId: user._id,
                    couponId: couponDetails._id,
                });
                if (usageCount >= Number(couponDetails.couponUsage.couponUsageLimit)) {
                    return {
                        status: false,
                        message: 'You have reached the usage limit for this coupon!'
                    };
                }
            }
            // Check overall coupon usage limit
            if (couponDetails.couponUsage.enableLimitPerUser) {
                const totalUsageCount = await cart_order_model_1.default.countDocuments({
                    couponId: couponDetails._id,
                });
                if (totalUsageCount >= Number(couponDetails.couponUsage.limitPerUser)) {
                    return {
                        status: false,
                        message: 'This coupon has reached its usage limit!'
                    };
                }
            }
            // If all checks pass, return successful verification
            return {
                status: true,
                message: 'Coupon applied successfully',
                requestedData: couponDetails
            };
        }
        catch (error) {
            console.error('Error checking coupon code:', error);
            return {
                status: false,
                message: 'An error occurred while verifying the coupon'
            };
        }
    }
    async findOne(query) {
        return coupon_model_1.default.findOne(query);
    }
}
exports.default = new CouponService();

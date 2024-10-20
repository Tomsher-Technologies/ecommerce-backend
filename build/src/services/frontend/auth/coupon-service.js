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
const cart_order_product_model_1 = __importDefault(require("../../../model/frontend/cart-order-product-model"));
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
        const { query, user, deviceType, uuid, clearActiveCartCoupon = '0' } = options;
        const currentDate = new Date();
        try {
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
            if (clearActiveCartCoupon === '1') {
                const activeCartCouponUsedQuery = {
                    couponId: couponDetails._id,
                    cartStatus: cart_1.cartStatus.active
                };
                if (user && user._id) {
                    activeCartCouponUsedQuery.customerId = user._id;
                }
                else if (uuid) {
                    activeCartCouponUsedQuery.guestUserId = uuid;
                }
                const update = await cart_order_model_1.default.updateMany({
                    ...activeCartCouponUsedQuery,
                    totalCouponAmount: { $gt: 0 }
                }, [
                    {
                        $set: {
                            couponId: null,
                            totalCouponAmount: 0,
                            totalAmount: {
                                $subtract: ["$totalAmount", "$totalCouponAmount"] // Update totalAmount by subtracting totalCouponAmount
                            }
                        }
                    }
                ]);
                console.log('update', update);
            }
            let cartQuery = { cartStatus: '1' };
            if (user && user._id) {
                cartQuery.customerId = user._id;
            }
            else if (uuid) {
                cartQuery.guestUserId = uuid;
            }
            const cartDetails = await cart_service_1.default.findOneCart(cartQuery);
            if (!cartDetails) {
                return {
                    status: false,
                    message: 'Active cart is not found!'
                };
            }
            if (cartDetails.totalAmount < Number(couponDetails.minPurchaseValue)) {
                return {
                    status: false,
                    message: `The coupon will apply with a minimum purchase of ${Number(couponDetails.minPurchaseValue)}`
                };
            }
            // Check if the totalCouponAmount exceeds discountMaxRedeemAmount for carts with status not equal to '1'
            const totalCouponAmounQuery = { cartStatus: '1' };
            if (user && user._id) {
                totalCouponAmounQuery.customerId = user._id;
            }
            if (uuid) {
                totalCouponAmounQuery.guestUserId = uuid;
            }
            if (Number(couponDetails.discountMaxRedeemAmount) > 0 && couponDetails.discountType === cart_1.couponDiscountType.percentage) {
                const totalCouponAmountResult = await cart_order_model_1.default.aggregate([
                    { $match: totalCouponAmounQuery },
                    { $group: { _id: null, totalCouponAmount: { $sum: "$totalCouponAmount" } } }
                ]);
                const totalCouponAmount = totalCouponAmountResult[0]?.totalCouponAmount || 0;
                if (totalCouponAmount >= Number(couponDetails.discountMaxRedeemAmount)) {
                    return {
                        status: false,
                        message: `The total coupon amount exceeds the maximum redeemable amount`
                    };
                }
            }
            if (![cart_1.couponTypes.entireOrders].includes(couponDetails.couponType)) {
                const cartProductDetails = await cart_order_product_model_1.default.find({ cartId: cartDetails._id });
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
                const onlyForNewUserQuery = { cartStatus: { $ne: '1' } };
                if (user && user._id) {
                    onlyForNewUserQuery.customerId = user._id;
                    onlyForNewUserQuery.isGuest = false;
                }
                const checkCart = await cart_service_1.default.findOneCart(onlyForNewUserQuery);
                if (checkCart) {
                    return {
                        status: false,
                        message: 'This coupon can only be used by new users!'
                    };
                }
            }
            // Check coupon usage limit per user
            if (couponDetails.couponUsage.enableCouponUsageLimit) {
                const usageCountQuery = {
                    couponId: couponDetails._id
                };
                if (user && user._id) {
                    usageCountQuery.customerId = user._id;
                }
                else if (uuid) {
                    usageCountQuery.guestUserId = uuid;
                }
                const usageCount = await cart_order_model_1.default.countDocuments(usageCountQuery);
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

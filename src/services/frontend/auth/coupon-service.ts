import { FilterOptionsProps, frontendPagination } from '../../../components/pagination';
import { cartStatus, couponDeviceType, couponDiscountType, couponTypes } from '../../../constants/cart';
import ProductsModel from '../../../model/admin/ecommerce/product-model';
import ProductCategoryLinkModel from '../../../model/admin/ecommerce/product/product-category-link-model';

import CouponModel from '../../../model/admin/marketing/coupon-model';
import CartOrdersModel from '../../../model/frontend/cart-order-model';
import CartOrderProductsModel from '../../../model/frontend/cart-order-product-model';
import { CustomerWishlistModelProps } from '../../../model/frontend/customer-wishlist-model';
import CartService from "../../../services/frontend/cart-service";

interface CheckCouponOptions {
    query: Record<string, any>;
    user: { _id: string };
    deviceType: string;
    uuid: string | undefined;
    clearActiveCartCoupon?: string;
}

interface CheckValues {
    status: boolean;
    message: string;
    requestedData?: Document | null;
}

class CouponService {
    async findAll(options: any): Promise<any> {
        let { query } = frontendPagination(options.query || {}, options);

        let pipeline: any[] = [
            { $match: query },

        ];

        return CouponModel.aggregate(pipeline).exec();
    }
    async checkCouponCode(options: CheckCouponOptions): Promise<CheckValues> {
        const { query, user, deviceType, uuid, clearActiveCartCoupon = '0' } = options;
        const currentDate = new Date();
        try {
            const couponDetails: any = await this.findOne({
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
                const activeCartCouponUsedQuery: any = {
                    couponId: couponDetails._id,
                    cartStatus: cartStatus.active
                };
                if (user && user._id) {
                    activeCartCouponUsedQuery.customerId = user._id;
                } else if (uuid) {
                    activeCartCouponUsedQuery.guestUserId = uuid;
                }
                const update = await CartOrdersModel.updateMany(
                    {
                        ...activeCartCouponUsedQuery,
                        totalCouponAmount: { $gt: 0 }
                    },
                    [
                        {
                            $set: {
                                couponId: null,
                                totalCouponAmount: 0,
                                totalAmount: {
                                    $subtract: ["$totalAmount", "$totalCouponAmount"] // Update totalAmount by subtracting totalCouponAmount
                                }
                            }
                        }
                    ]
                );
                console.log('update', update);
            }

            let cartQuery: any = { cartStatus: '1' };
            if (user && user._id) {
                cartQuery.customerId = user._id;
            } else if (uuid) {
                cartQuery.guestUserId = uuid;
            }

            const cartDetails = await CartService.findOneCart(cartQuery);
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
            const totalCouponAmounQuery: any = { cartStatus: '1' };
            if (user && user._id) {
                totalCouponAmounQuery.customerId = user._id;
            }
            if (uuid) {
                totalCouponAmounQuery.guestUserId = uuid;
            }
            if (Number(couponDetails.discountMaxRedeemAmount) > 0 && couponDetails.discountType === couponDiscountType.percentage) {
                const totalCouponAmountResult = await CartOrdersModel.aggregate([
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


            if (![couponTypes.entireOrders].includes(couponDetails.couponType)) {
                const cartProductDetails = await CartOrderProductsModel.find({ cartId: cartDetails._id });
                const productIds = cartProductDetails.map((product: any) => product.productId.toString());
                const applicableCouponApplyValues = couponDetails.couponApplyValues;

                if (couponDetails.couponType === couponTypes.forProduct) {
                    if (!productIds.some((id: string) => applicableCouponApplyValues.includes(id))) {
                        return {
                            status: false,
                            message: "This coupon can't be used for the products in your cart!"
                        };
                    }
                } else if (couponDetails.couponType === couponTypes.forBrand) {
                    const productDetails = await ProductsModel.find({ _id: { $in: productIds } });
                    const brandIds = productDetails.map((product: any) => product.brand.toString());
                    if (!brandIds.some((id: string) => applicableCouponApplyValues.includes(id))) {
                        return {
                            status: false,
                            message: "This coupon can't be used for the brands in your cart!"
                        };
                    }
                } else if (couponDetails.couponType === couponTypes.forCategory) {
                    const productCategoryDetails = await ProductCategoryLinkModel.find({ productId: { $in: productIds } });
                    const categoryIds = productCategoryDetails.map((product: any) => product.categoryId.toString());
                    if (!categoryIds.some((id: string) => applicableCouponApplyValues.includes(id))) {
                        return {
                            status: false,
                            message: "This coupon can't be used for the categories in your cart!"
                        };
                    }
                }
            }
            // Check if the coupon is only for mobile app users
            if (couponDetails.couponUsage.mobileAppOnlyCoupon && deviceType !== couponDeviceType.mobile) {
                return {
                    status: false,
                    message: 'This coupon can only be used by mobile application users!'
                };
            }

            // Check if the coupon is only for new users
            if (couponDetails.couponUsage.onlyForNewUser) {
                const onlyForNewUserQuery: any = { cartStatus: { $ne: '1' } };
                if (user && user._id) {
                    onlyForNewUserQuery.customerId = user._id;
                    onlyForNewUserQuery.isGuest = false;
                }
                const checkCart = await CartService.findOneCart(onlyForNewUserQuery);
                if (checkCart) {
                    return {
                        status: false,
                        message: 'This coupon can only be used by new users!'
                    };
                }
            }

            // Check coupon usage limit per user
            if (couponDetails.couponUsage.enableCouponUsageLimit) {
                const usageCountQuery: any = {
                    couponId: couponDetails._id
                };
                if (user && user._id) {
                    usageCountQuery.customerId = user._id;
                } else if (uuid) {
                    usageCountQuery.guestUserId = uuid;
                }
                const usageCount = await CartOrdersModel.countDocuments(usageCountQuery);
                if (usageCount >= Number(couponDetails.couponUsage.couponUsageLimit)) {
                    return {
                        status: false,
                        message: 'You have reached the usage limit for this coupon!'
                    };
                }
            }

            // Check overall coupon usage limit
            if (couponDetails.couponUsage.enableLimitPerUser) {
                const totalUsageCount = await CartOrdersModel.countDocuments({
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
        } catch (error) {
            console.error('Error checking coupon code:', error);
            return {
                status: false,
                message: 'An error occurred while verifying the coupon'
            };
        }
    }
    async findOne(query: any): Promise<CustomerWishlistModelProps | null> {
        return CouponModel.findOne(query);
    }

}

export default new CouponService();

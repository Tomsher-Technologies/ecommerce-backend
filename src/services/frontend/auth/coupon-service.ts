import { FilterOptionsProps, frontendPagination } from '../../../components/pagination';
import { couponDeviceType } from '../../../constants/cart';

import CouponModel from '../../../model/admin/marketing/coupon-model';
import { CustomerWishlistModelProps } from '../../../model/frontend/customer-wishlist-model';
import CartService from "../../../services/frontend/cart-service";


class CouponService {
    async findAll(options: any): Promise<any> {
        let { query } = frontendPagination(options.query || {}, options);

        let pipeline: any[] = [
            { $match: query },

        ];

        return CouponModel.aggregate(pipeline).exec();
    }
    async checkCouponCode(options: any): Promise<any> {
        const { query, user, deviceType } = options;

        const couponDetails: any = await this.findOne(query);
        if (couponDetails) {
            if (couponDetails.couponUsage.mobileAppOnlyCoupon) {
                if (deviceType === couponDeviceType.mobile) {
                    return {
                        status: true,
                        requestedData: couponDetails,
                        message: 'This coupon are successfully verified'
                    }
                } else {
                    return {
                        status: false,
                        message: 'This Coupon only to use mobile application users!'
                    }
                }
            } else if (couponDetails.couponUsage.onlyForNewUser) {
                const checkCart = await CartService.findOneCart({
                    customerId: user._id
                });
                console.log(user._id);

                if (checkCart) {
                    return {
                        status: false,
                        message: 'This Coupon only to use mobile application users!'
                    }
                } else {
                    return {
                        status: true,
                        requestedData: couponDetails,
                        message: 'This coupon are successfully verified'
                    }
                }
            }
        } else {
            return {
                status: false,
                message: 'Coupon not found!'
            }
        }
    }

    async findOne(query: any): Promise<CustomerWishlistModelProps | null> {
        return CouponModel.findOne(query);
    }

}

export default new CouponService();

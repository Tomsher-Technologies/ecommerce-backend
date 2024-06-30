import { cartStatus, couponDiscountType, couponTypes, orderPaymentStatus } from "../../constants/cart";
import { DiscountType, calculateTotalDiscountAmountDifference } from "../../utils/helpers";
import CouponService from "./auth/coupon-service";

import CartService from "./cart-service";
import ProductsModel from "../../model/admin/ecommerce/product-model";
import ProductCategoryLinkModel from "../../model/admin/ecommerce/product/product-category-link-model";
import CartOrdersModel from "../../model/frontend/cart-order-model";
import PaymentTransactionModel from "../../model/frontend/payment-transaction-model";

class CheckoutService {


    async paymentResponse(options: any = {}): Promise<any> {
        const { transactionId, allPaymentResponseData, paymentStatus } = options;
        const paymentDetails = await PaymentTransactionModel.findOne({ transactionId });
        if (!paymentDetails) {
            return {
                status: false,
                message: 'Payment transactions not found'
            }
        }

        const cartDetails: any = await CartOrdersModel.findOne({ _id: paymentDetails?.orderId, cartStatus: "1" })

        if (!cartDetails) {
            const cartUpdation = this.cartUpdation(cartDetails, false);
            return {
                orderId: null,
                status: false,
                message: 'Active cart not found'
            }
        }
        if (paymentStatus === orderPaymentStatus.success) {
            const updateTransaction = await PaymentTransactionModel.findByIdAndUpdate(
                paymentDetails?._id, {
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
                }
            } else {
                return {
                    orderId: cartDetails._id,
                    status: false,
                    message: 'update transaction is fail please contact administrator'
                }
            }
        } else {
            const updateTransaction = await PaymentTransactionModel.findByIdAndUpdate(
                paymentDetails?._id, {
                data: JSON.stringify(allPaymentResponseData),
                status: paymentStatus,
                createdAt: new Date(),
            }, { new: true, useFindAndModify: false });
            this.cartUpdation(cartDetails, false);

            return {
                orderId: cartDetails._id,
                status: false,
                message: paymentStatus
            }
        }
    }

    async cartUpdation(cartDetails: any, paymentSuccess: boolean): Promise<any> {
        if (cartDetails) {

            let cartUpdate = {
                cartStatus: cartStatus.active,
                totalAmount: cartDetails?.totalAmount,
                totalCouponAmount: 0,
                couponId: cartDetails?.couponId
            }
            if (!paymentSuccess) {
                cartUpdate = {
                    ...cartUpdate,
                    couponId: null
                }
            } else {
                const couponDetails: any = await CouponService.findOne({ _id: cartDetails?.couponId });
                if (couponDetails) {
                    const cartProductDetails: any = await CartService.findAllCart({ cartId: cartDetails?._id });
                    const productIds = cartProductDetails.map((product: any) => product.productId.toString());

                    const couponAmount = couponDetails?.requestedData?.discountAmount;
                    const discountType = couponDetails?.requestedData?.discountType

                    const updateTotalCouponAmount = (productAmount: any, discountAmount: number, discountType: DiscountType) => {
                        if (productAmount) {
                            const totalCouponAmount = calculateTotalDiscountAmountDifference(productAmount, discountType, discountAmount);
                            const cartTtotalAmount = cartDetails?.totalAmount - calculateTotalDiscountAmountDifference(productAmount, discountType, discountAmount);
                            cartUpdate = {
                                ...cartUpdate,
                                totalAmount: cartTtotalAmount,
                                totalCouponAmount: totalCouponAmount
                            }
                        }
                    };

                    if (couponDetails?.requestedData.couponType == couponTypes.entireOrders) {
                        updateTotalCouponAmount(cartDetails?.totalAmount, couponAmount, discountType)
                    } else if (couponDetails?.requestedData.couponType == couponTypes.forProduct) {
                        cartProductDetails.map(async (product: any) => {
                            if (couponDetails?.requestedData.couponApplyValues.includes((product.productId.toString()))) {
                                updateTotalCouponAmount(product.productAmount, couponAmount, discountType)
                            }
                        });
                    } else if (couponDetails?.requestedData.couponType == couponTypes.forCategory) {
                        const productCategoryDetails = await ProductCategoryLinkModel.find({ productId: { $in: productIds } });
                        const categoryIds = productCategoryDetails.map((product: any) => product.categoryId.toString());
                        categoryIds.map(async (product: any) => {
                            if (couponDetails?.requestedData.couponApplyValues.includes((product.productId.toString()))) {
                                updateTotalCouponAmount(product.productAmount, couponAmount, discountType)
                            }
                        });
                    } else if (couponDetails?.requestedData.couponType == couponTypes.forBrand) {
                        const productDetails = await ProductsModel.find({ _id: { $in: productIds } });
                        const brandIds = productDetails.map((product: any) => product.brand.toString());
                        brandIds.map(async (product: any) => {
                            if (couponDetails?.requestedData.couponApplyValues.includes((product.productId.toString()))) {
                                updateTotalCouponAmount(product.productAmount, couponAmount, discountType)
                            }
                        });
                    }
                }
            }

            cartUpdate = {
                ...cartUpdate,
                cartStatus: cartStatus.order,
                processingStatusAt: new Date(),
                orderStatusAt: new Date(),
            } as any;

            const updateCart = await CartService.update(cartDetails?._id, cartUpdate)
            if (!updateCart) {
                return {
                    orderId: cartDetails?._id,
                    status: false,
                    message: 'Cart updation failed'
                }
            } else {
                return {
                    orderId: cartDetails?._id,
                    status: true,
                    message: 'Cart updation success'
                }
            }
        }
    }
}
export default new CheckoutService();

import { cartStatus, couponTypes, orderPaymentStatus, orderStatusMap, paymentMethods } from "../../constants/cart";
import { DiscountType, calculateTotalDiscountAmountDifference, } from "../../utils/helpers";
import CouponService from "./auth/coupon-service";

import CartService from "./cart-service";
import ProductsModel from "../../model/admin/ecommerce/product-model";
import ProductCategoryLinkModel from "../../model/admin/ecommerce/product/product-category-link-model";
import CartOrdersModel from "../../model/frontend/cart-order-model";
import PaymentTransactionModel from "../../model/frontend/payment-transaction-model";
import mongoose from "mongoose";

class CheckoutService {

    async paymentResponse(options: any = {}): Promise<any> {
        const { transactionId, paymentId, paymentMethod, allPaymentResponseData, paymentStatus } = options;
        const paymentDetails: any = await PaymentTransactionModel.findOne(
            paymentMethod === paymentMethods.tabby ? { paymentId } : { transactionId }
        );

        if (!paymentDetails) {
            return {
                status: false,
                message: 'Payment transactions not found'
            }
        }
        console.log('paymentDetails', paymentDetails);
        const cartDetails: any = await CartOrdersModel.findOne({ _id: paymentDetails?.orderId, cartStatus: "1" })
        const newcartDetails: any = await CartOrdersModel.findOne({ _id: new mongoose.Types.ObjectId(paymentDetails?.orderId) })
        console.log('cartDetails', newcartDetails);

        if (!cartDetails) {
            const cartUpdation = this.cartUpdation(cartDetails, false);
            return {
                _id: null,
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
                    _id: cartDetails._id,
                    orderId: cartDetails.orderId,
                    status: true,
                    message: 'Payment success'
                }
            } else {
                return {
                    _id: cartDetails._id,
                    orderId: cartDetails.orderId,
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
                _id: cartDetails._id,
                orderId: cartDetails.orderId,
                status: false,
                message: paymentStatus
            }
        }
    }


    async getNextSequenceValue(): Promise<string> {
        const maxOrder: any = await CartOrdersModel.find().sort({ orderId: -1 }).limit(1);
        console.log('maxOrder', maxOrder);

        if (Array.isArray(maxOrder) && maxOrder.length > 0 && maxOrder[0].orderId) {
            const maxOrderId = maxOrder[0].orderId;
            const nextOrderId = (parseInt(maxOrderId, 10) + 1).toString().padStart(6, '0');
            return nextOrderId;
        } else {
            return '000001';
        }
    }


    async cartUpdation(cartDetails: any, paymentSuccess: boolean): Promise<any> {
        if (cartDetails) {

            let cartUpdate = {
                cartStatus: cartStatus.active,
                totalAmount: cartDetails?.totalAmount,
                totalCouponAmount: 0,
                couponId: cartDetails?.couponId,
                paymentMethodId: cartDetails?.paymentMethodId
            }
            if (!paymentSuccess) {
                cartUpdate = {
                    ...cartUpdate,
                    couponId: null,
                    paymentMethodId: null
                }
            } else {
                const couponDetails: any = await CouponService.findOne({ _id: cartDetails?.couponId });
                if (couponDetails) {
                    const cartProductDetails: any = await CartService.findAllCart({ cartId: cartDetails?._id });
                    const productIds = cartProductDetails.map((product: any) => product.productId.toString());

                    const couponAmount = couponDetails?.discountAmount;
                    const discountType = couponDetails.discountType
                    const updateTotalCouponAmount = (productAmount: any, discountAmount: number, discountType: DiscountType) => {
                        if (productAmount) {
                            const totalCouponAmount = calculateTotalDiscountAmountDifference(productAmount, discountType, discountAmount);
                            const cartTotalAmount = cartDetails?.totalAmount - calculateTotalDiscountAmountDifference(productAmount, discountType, discountAmount);
                            cartUpdate = {
                                ...cartUpdate,
                                totalAmount: cartTotalAmount,
                                totalCouponAmount: totalCouponAmount
                            }
                        }
                    };
                    var totalAmount = 0
                    if (couponDetails?.couponType == couponTypes.entireOrders) {
                        updateTotalCouponAmount(cartDetails?.totalAmount, couponAmount, discountType)
                    } else if (couponDetails?.couponType == couponTypes.forProduct) {
                        cartProductDetails.map(async (product: any) => {
                            if (couponDetails?.couponApplyValues.includes((product.productId))) {
                                totalAmount += product.productAmount
                                // updateTotalCouponAmount(product.productAmount, couponAmount, discountType)
                            }
                        });
                        updateTotalCouponAmount(totalAmount, couponAmount, discountType)
                    } else if (couponDetails?.couponType == couponTypes.forCategory) {
                        const productCategoryDetails = await ProductCategoryLinkModel.find({ productId: { $in: productIds } });
                        const categoryIds = productCategoryDetails.map((product: any) => product.categoryId);
                        categoryIds.map(async (product: any) => {
                            if (couponDetails?.couponApplyValues.includes((product.productId.toString()))) {
                                totalAmount += product.productAmount

                                // updateTotalCouponAmount(product.productAmount, couponAmount, discountType)
                            }
                        });
                        updateTotalCouponAmount(totalAmount, couponAmount, discountType)
                    } else if (couponDetails?.couponType == couponTypes.forBrand) {
                        const productDetails = await ProductsModel.find({ _id: { $in: productIds } });
                        const brandIds = productDetails.map((product: any) => product.brand);
                        brandIds.map(async (product: any) => {
                            if (couponDetails?.couponApplyValues.includes((product.productId))) {
                                totalAmount += product.productAmount

                                // updateTotalCouponAmount(product.productAmount, couponAmount, discountType)
                            }
                        });
                        updateTotalCouponAmount(totalAmount, couponAmount, discountType)
                    }
                }
            }

            const orderId = await this.getNextSequenceValue();

            cartUpdate = {
                ...cartUpdate,
                orderId: orderId,
                cartStatus: cartStatus.order,
                orderStatus: orderStatusMap['1'].value,
                processingStatusAt: new Date(),
                orderStatusAt: new Date(),
            } as any;

            const updateCart = await CartService.update(cartDetails?._id, cartUpdate)
            if (!updateCart) {
                return {
                    _id: cartDetails?._id,
                    orderId: orderId,
                    status: false,
                    message: 'Cart updation failed'
                }
            } else {
                return {
                    _id: cartDetails?._id,
                    orderId: orderId,
                    status: true,
                    message: 'Cart updation success'
                }
            }
        }
    }
}
export default new CheckoutService();

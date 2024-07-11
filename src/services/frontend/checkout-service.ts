import path from 'path';
const ejs = require('ejs');

import { cartStatus, couponTypes, orderPaymentStatus, orderStatusMap, orderStatusMessages, paymentMethods } from "../../constants/cart";
import { DiscountType, calculateExpectedDeliveryDate, calculateTotalDiscountAmountDifference, } from "../../utils/helpers";
import CouponService from "./auth/coupon-service";

import CartService from "./cart-service";
import ProductsModel from "../../model/admin/ecommerce/product-model";
import ProductCategoryLinkModel from "../../model/admin/ecommerce/product/product-category-link-model";
import CartOrdersModel from "../../model/frontend/cart-order-model";
import PaymentTransactionModel from "../../model/frontend/payment-transaction-model";
import CustomerModel from '../../model/frontend/customers-model';
import { blockReferences, websiteSetup } from '../../constants/website-setup';
import WebsiteSetupModel from '../../model/admin/setup/website-setup-model';
import { mailChimpEmailGateway } from '../../lib/mail-chimp-sms-gateway';
import CustomerAddress from '../../model/frontend/customer-address-model';
import { buildOrderPipeline, cartDeatilProject, cartLookup, customerLookup, orderListObjectLookup, paymentMethodLookup } from '../../utils/config/cart-order-config';
import { productLookup } from '../../utils/config/product-config';
import { productVariantsLookupValues, replaceProductLookupValues } from '../../utils/config/wishlist-config';

class CheckoutService {

    async paymentResponse(options: any = {}): Promise<any> {
        const { transactionId, paymentId, paymentMethod, allPaymentResponseData, paymentStatus } = options;
        const paymentDetails = await PaymentTransactionModel.findOne(
            paymentMethod === paymentMethods.tabby ? { paymentId } : { transactionId }
        );

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

            this.cartUpdation({
                ...cartDetails,
                _id: cartDetails?._id,
                totalAmount: cartDetails?.totalAmount,
                customerId: cartDetails.customerId,
                couponId: cartDetails?.couponId,
                countryId: cartDetails?.countryId,
                shippingId: cartDetails?.shippingId,
                orderStatusAt: cartDetails?.orderStatusAt,
                orderStatus: cartDetails?.orderStatus,
                paymentMethodId: cartDetails?.paymentMethodId,
                totalShippingAmount: cartDetails.totalShippingAmount,
                totalProductAmount: cartDetails.totalProductAmount,
                orderComments: cartDetails?.orderComments,
            }, true);

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
                    cartStatus: cartStatus.active,
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
                            }
                        });
                        updateTotalCouponAmount(totalAmount, couponAmount, discountType)
                    } else if (couponDetails?.couponType == couponTypes.forCategory) {
                        const productCategoryDetails = await ProductCategoryLinkModel.find({ productId: { $in: productIds } });
                        const categoryIds = productCategoryDetails.map((product: any) => product.categoryId);
                        categoryIds.map(async (product: any) => {
                            if (couponDetails?.couponApplyValues.includes((product.productId.toString()))) {
                                totalAmount += product.productAmount
                            }
                        });
                        updateTotalCouponAmount(totalAmount, couponAmount, discountType)
                    } else if (couponDetails?.couponType == couponTypes.forBrand) {
                        const productDetails = await ProductsModel.find({ _id: { $in: productIds } });
                        const brandIds = productDetails.map((product: any) => product.brand);
                        brandIds.map(async (product: any) => {
                            if (couponDetails?.couponApplyValues.includes((product.productId))) {
                                totalAmount += product.productAmount
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

            let cartProducts = cartDetails?.products || null
            let customerDetails = cartDetails?.customerDetails || null;
            let paymentMethodDetails = cartDetails?.paymentMethod || null;

            const updateCart = await CartService.update(cartDetails?._id, cartUpdate)
            if (!updateCart) {
                return {
                    _id: cartDetails?._id,
                    orderId: orderId,
                    status: false,
                    message: 'Cart updation failed'
                }
            } else {
                if (!cartProducts) {
                    const pipeline = buildOrderPipeline(paymentMethodDetails, customerDetails, cartDetails);
                    const createdCartWithValues = await CartOrdersModel.aggregate(pipeline);

                    if (createdCartWithValues && createdCartWithValues.length > 0) {
                        if (createdCartWithValues[0]?.products) {
                            cartProducts = createdCartWithValues[0].products;
                        }
                        if (paymentMethodDetails == null) {
                            paymentMethodDetails = createdCartWithValues[0]?.paymentMethod;
                        }
                        if (customerDetails == null) {
                            customerDetails = createdCartWithValues[0]?.customer;
                        }
                    }
                }

                if (cartProducts) {
                    if (customerDetails === null) {
                        customerDetails = await CustomerModel.findOne({ _id: cartDetails.customerId });
                    }

                    let websiteSettingsQuery: any = { _id: { $exists: true } };
                    websiteSettingsQuery = {
                        ...websiteSettingsQuery,
                        countryId: cartDetails.countryId,
                        block: websiteSetup.basicSettings,
                        blockReference: { $in: [blockReferences.defualtSettings, blockReferences.basicDetailsSettings] },
                        status: '1',
                    } as any;

                    const settingsDetails = await WebsiteSetupModel.find(websiteSettingsQuery);
                    const defualtSettings = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.defualtSettings);
                    const basicDetailsSettings = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.basicDetailsSettings)?.blockValues;

                    const shippingAddressDetails: any = await CustomerAddress.findById(cartDetails.shippingId);

                    let commonDeliveryDays = '8';
                    if (defualtSettings && defualtSettings.blockValues && defualtSettings.blockValues.commonDeliveryDays) {
                        commonDeliveryDays = defualtSettings.blockValues.commonDeliveryDays
                    }

                    const expectedDeliveryDate = calculateExpectedDeliveryDate(cartDetails.orderStatusAt, Number(commonDeliveryDays))

                    ejs.renderFile(path.join(__dirname, '../../views/email/order', 'order-creation-email.ejs'), {
                        firstName: customerDetails?.firstName,
                        orderId: orderId,
                        totalAmount: cartUpdate.totalAmount,
                        totalShippingAmount: cartDetails.totalShippingAmount,
                        totalProductAmount: cartDetails.totalProductAmount,
                        orderComments: cartDetails?.orderComments,
                        paymentMethod: paymentMethodDetails?.paymentMethodTitle,
                        shippingAddressDetails: {
                            name: shippingAddressDetails.name,
                            addressType: shippingAddressDetails.addressType,
                            address1: shippingAddressDetails.address1,
                            address2: shippingAddressDetails.address2,
                            city: shippingAddressDetails.city,
                            state: shippingAddressDetails.state,
                            country: shippingAddressDetails.country,
                            phoneNumber: shippingAddressDetails.phoneNumber,
                            landlineNumber: shippingAddressDetails.landlineNumber,
                            email: customerDetails.email
                        },
                        expectedDeliveryDate,
                        storeEmail: basicDetailsSettings?.storeEmail,
                        storePhone: basicDetailsSettings?.storePhone,
                        products: cartProducts,
                        shopName: basicDetailsSettings?.shopName || `${process.env.SHOPNAME}`,
                        shopLogo: `${process.env.SHOPLOGO}`,
                        appUrl: `${process.env.APPURL}`
                    }, async (err: any, template: any) => {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        await mailChimpEmailGateway({
                            subject: orderStatusMessages['1'],
                            email: customerDetails.email,
                        }, template)
                    });
                }
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

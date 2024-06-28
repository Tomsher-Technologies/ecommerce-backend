import BaseController from "../../admin/base-controller";
import { Request, Response, query } from 'express';
import CommonService from '../../../services/frontend/guest/common-service'
import CartService from '../../../services/frontend/cart-service';
import PaymentMethodModel from "../../../model/admin/setup/payment-methods-model";
import { paymentMethods, couponTypes, couponDiscountType } from "../../../constants/cart";
import WebsiteSetupModel from "../../../model/admin/setup/website-setup-model";
import { blockReferences } from "../../../constants/website-setup";
import CouponService from "../../../services/frontend/auth/coupon-service";
import { checkoutSchema } from "../../../utils/schemas/frontend/auth/checkout-schema";
import { formatZodError } from "../../../utils/helpers";
import ProductCategoryLinkModel from "../../../model/admin/ecommerce/product/product-category-link-model";
import ProductsModel from "../../../model/admin/ecommerce/product-model";
import axios from 'axios';
import { tapPayment } from "../../../lib/tap-payment";
import CustomerModel from "../../../model/frontend/customers-model";
import { tapPaymentGatwayDefaultValues } from "../../../utils/frontend/cart-utils";
import PaymentTransactionModel from "../../../model/frontend/payment-transaction-model";

const controller = new BaseController();

class CheckoutController extends BaseController {

    async checkout(req: Request, res: Response): Promise<void> {
        try {

            const customerId: any = res.locals.user;
            let countryData = await CommonService.findOneCountrySubDomainWithId(req.get('origin'), true);
            if (!countryData) {
                return controller.sendErrorResponse(res, 500, { message: 'Country is missing' });
            }
            const validatedData = checkoutSchema.safeParse(req.body);
            if (validatedData.success) {
                const { deviceType, couponCode, paymentMethodId, shippingId, billingId, } = validatedData.data;

                const customerDetails: any = await CustomerModel.findOne({ _id: customerId });
                if (!customerDetails) {
                    return controller.sendErrorResponse(res, 500, { message: 'User is not found' });
                }

                const paymentMethod: any = await PaymentMethodModel.findOne({ _id: paymentMethodId })
                if (!paymentMethod) {
                    return controller.sendErrorResponse(res, 500, { message: 'Something went wrong, payment method is not found' });
                }

                const cart: any = await CartService.findCartPopulate({
                    query: {
                        $and: [
                            { customerId: customerId },
                            { countryId: countryData._id },
                            { cartStatus: "1" }
                        ],

                    },
                    hostName: req.get('origin'),
                })
                if (!cart) {
                    return controller.sendErrorResponse(res, 500, { message: 'Cart not found!' });
                }
                let couponAmountTotal: any = 0
                let productId: any
                let cartUpdate = {
                    paymentMethodCharge: 0,
                    couponId: null,
                    totalCouponAmount: couponAmountTotal,
                    totalAmount: cart.totalAmount,
                    shippingId: shippingId,
                    billingId: billingId
                }
                if (couponCode && deviceType) {

                    const query = {
                        countryId: countryData._id,
                        couponCode,
                    } as any;

                    const couponDetails: any = await CouponService.checkCouponCode({ query, user: customerId, deviceType });

                    if (couponDetails?.status) {

                        cartUpdate = {
                            ...cartUpdate,
                            couponId: couponDetails?.requestedData._id,
                        }

                        const cartProductDetails: any = await CartService.findAllCart({ cartId: cart._id });
                        const productIds = cartProductDetails.map((product: any) => product.productId.toString());

                        const discountedAmountByPercentage = (couponDetails?.requestedData.discountAmount) / 100 * cart.totalAmount
                        const couponPercentage = Math.min(discountedAmountByPercentage, couponDetails?.requestedData.discountMaxRedeemAmount);
                        const couponAmount = couponDetails?.requestedData.discountAmount

                        const updateTotalCouponAmount = (product: any) => {
                            if (product) {
                                couponAmountTotal = product.productAmount - couponAmount;
                                productId = product.productId;
                            }
                        };

                        if (couponDetails?.requestedData.couponType == couponTypes.entireOrders) {
                            if (couponDetails?.requestedData.discountType == couponDiscountType.amount) {
                                couponAmountTotal = couponAmount
                            }
                            if (couponDetails?.requestedData.discountType == couponDiscountType.percentage) {
                                couponAmountTotal = couponPercentage
                            }
                        } else if (couponDetails?.requestedData.couponType == couponTypes.forProduct) {
                            if (couponDetails?.requestedData.discountType == couponDiscountType.amount) {
                                // couponAmountTotal = couponAmount
                                const updatedCartProductDetails = cartProductDetails.map(async (product: any) => {
                                    if (couponDetails?.requestedData.couponApplyValues.includes((product.productId.toString()))) {
                                        updateTotalCouponAmount(product)
                                    }
                                });
                            }
                            if (couponDetails?.requestedData.discountType == couponDiscountType.percentage) {
                                const updatedCartProductDetails = cartProductDetails.map(async (product: any) => {
                                    if (couponDetails?.requestedData.couponApplyValues.includes((product.productId.toString()))) {
                                        updateTotalCouponAmount(product)
                                    }
                                });
                            }
                        } else if (couponDetails?.requestedData.couponType == couponTypes.forCategory) {
                            const productCategoryDetails = await ProductCategoryLinkModel.find({ productId: { $in: productIds } });
                            const categoryIds = productCategoryDetails.map((product: any) => product.categoryId.toString());
                            if (couponDetails?.requestedData.discountType == couponDiscountType.amount) {
                                const updatedCartProductDetails = categoryIds.map(async (product: any) => {
                                    if (couponDetails?.requestedData.couponApplyValues.includes((product.productId.toString()))) {
                                        updateTotalCouponAmount(product)
                                    }
                                });
                            }
                            if (couponDetails?.requestedData.discountType == couponDiscountType.percentage) {
                                const updatedCartProductDetails = categoryIds.map(async (product: any) => {
                                    if (couponDetails?.requestedData.couponApplyValues.includes((product.productId.toString()))) {
                                        updateTotalCouponAmount(product)
                                    }
                                });
                            }
                        } else if (couponDetails?.requestedData.couponType == couponTypes.forBrand) {
                            const productDetails = await ProductsModel.find({ _id: { $in: productIds } });
                            const brandIds = productDetails.map((product: any) => product.brand.toString());
                            if (couponDetails?.requestedData.discountType == couponDiscountType.amount) {
                                const updatedCartProductDetails = brandIds.map(async (product: any) => {
                                    if (couponDetails?.requestedData.couponApplyValues.includes((product.productId.toString()))) {
                                        updateTotalCouponAmount(product)
                                    }
                                });
                            }
                            if (couponDetails?.requestedData.discountType == couponDiscountType.percentage) {
                                const updatedCartProductDetails = brandIds.map(async (product: any) => {
                                    if (couponDetails?.requestedData.couponApplyValues.includes((product.productId.toString()))) {
                                        updateTotalCouponAmount(product)
                                    }
                                });
                            }
                        }

                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: couponDetails?.message,
                        });
                    }

                }

                cartUpdate = {
                    ...cartUpdate,
                    totalCouponAmount: couponAmountTotal,
                    totalAmount: cart.totalAmount - couponAmountTotal,
                }


                if (paymentMethod.slug !== paymentMethods.cashOnDelivery) {

                    if (paymentMethod && paymentMethod.slug == paymentMethods.tap) {
                        const tapDefaultValues = tapPaymentGatwayDefaultValues(countryData, { ...cartUpdate, _id: cart._id }, customerDetails)

                        const tapResponse = await tapPayment(tapDefaultValues)
                        console.log("cartUpdatecartUpdate", tapResponse);

                    } else if (paymentMethod && paymentMethod.slug == paymentMethods.tabby) {

                    }
                } else {
                    const codAmount: any = await WebsiteSetupModel.findOne({ blockReference: blockReferences.defualtSettings })
                    cartUpdate = {
                        ...cartUpdate,
                        paymentMethodCharge: codAmount.blockValues.codCharge
                    }
                }

                // if (couponCode) {
                //     const updateCartProduct = await CartService.updateCartProduct(productId, { productAmount: couponAmountTotal })
                // }
                const updateCart = await CartService.update(cart._id, cartUpdate)

                return controller.sendErrorResponse(res, 200, {
                    message: 'Some error occurred while Checkout',
                });


            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                });
            }



        } catch (error: any) {

            return controller.sendErrorResponse(res, 200, {
                message: error.message || 'Some error occurred while Checkout',
            });
        }
    }

    async tapSuccessResponse(req: Request, res: Response): Promise<void> {
        console.log('here',);
        await PaymentTransactionModel.create({
            data: JSON.stringify(req.query),
            status: '1',
            createdAt: new Date(),
        })
        res.redirect("http://stackoverflow.com");

    }
}

export default new CheckoutController();
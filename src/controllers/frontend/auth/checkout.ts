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

const controller = new BaseController();

class CheckoutController extends BaseController {

    async checkout(req: Request, res: Response): Promise<void> {
        try {

            const customerId: any = res.locals.user;
            let countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
            if (!countryId) {
                return controller.sendErrorResponse(res, 500, { message: 'Country is missing' });
            }
            const validatedData = checkoutSchema.safeParse(req.body);
            if (validatedData.success) {
                const { deviceType, couponCode, paymentMethodId, shippingId, billingId } = validatedData.data;

                const cart: any = await CartService.findCartPopulate({
                    query: {
                        $and: [
                            { customerId: customerId },
                            { countryId: countryId },
                            { cartStatus: "1" }
                        ],

                    },
                    hostName: req.get('origin'),
                })
                if (!cart) {
                    return controller.sendErrorResponse(res, 500, { message: 'Cart not found!' });
                }
                let couponId
                let couponAmountTotal: any
                let productId: any
                if (couponCode && deviceType) {

                    const query = {
                        countryId,
                        couponCode,
                    } as any;

                    const couponDetails: any = await CouponService.checkCouponCode({ query, user: customerId, deviceType });

                    console.log("couponDetails", couponDetails);
                    if (couponDetails?.status) {

                        couponId = couponDetails?.requestedData._id
                        const cartProductDetails: any = await CartService.findAllCart({ cartId: cart._id });
                        const productIds = cartProductDetails.map((product: any) => product.productId.toString());

                        const discountedAmount = (couponDetails?.requestedData.discountAmount) / 100 * cart.totalAmount
                        const couponPercentage = Math.min(discountedAmount, couponDetails?.requestedData.discountMaxRedeemAmount);
                        const couponAmount = couponDetails?.requestedData.discountAmount

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
                                        couponAmountTotal = product.productAmount - couponAmount
                                        productId = product.productId
                                    }
                                });
                            }
                            if (couponDetails?.requestedData.discountType == couponDiscountType.percentage) {
                                const updatedCartProductDetails = cartProductDetails.map(async (product: any) => {
                                    if (couponDetails?.requestedData.couponApplyValues.includes((product.productId.toString()))) {
                                        couponAmountTotal = product.productAmount - couponAmount
                                        // const updateCartProduct = await CartService.updateCartProduct(product._id, { productAmount: product.productAmount })
                                        productId = product.productId
                                    }
                                });
                            }
                        } else if (couponDetails?.requestedData.couponType == couponTypes.forCategory) {
                            const productCategoryDetails = await ProductCategoryLinkModel.find({ productId: { $in: productIds } });
                            const categoryIds = productCategoryDetails.map((product: any) => product.categoryId.toString());
                            if (couponDetails?.requestedData.discountType == couponDiscountType.amount) {
                                const updatedCartProductDetails = categoryIds.map(async (product: any) => {
                                    if (couponDetails?.requestedData.couponApplyValues.includes((product.productId.toString()))) {
                                        couponAmountTotal = product.productAmount - couponAmount
                                        productId = product.productId
                                    }
                                });
                            }
                            if (couponDetails?.requestedData.discountType == couponDiscountType.percentage) {
                                const updatedCartProductDetails = categoryIds.map(async (product: any) => {
                                    if (couponDetails?.requestedData.couponApplyValues.includes((product.productId.toString()))) {
                                        couponAmountTotal = product.productAmount - couponAmount
                                        productId = product.productId
                                    }
                                });
                            }
                        } else if (couponDetails?.requestedData.couponType == couponTypes.forBrand) {
                            const productDetails = await ProductsModel.find({ _id: { $in: productIds } });
                            const brandIds = productDetails.map((product: any) => product.brand.toString());
                            if (couponDetails?.requestedData.discountType == couponDiscountType.amount) {
                                const updatedCartProductDetails = brandIds.map(async (product: any) => {
                                    if (couponDetails?.requestedData.couponApplyValues.includes((product.productId.toString()))) {
                                        couponAmountTotal = product.productAmount - couponAmount
                                        productId = product.productId
                                    }
                                });
                            }
                            if (couponDetails?.requestedData.discountType == couponDiscountType.percentage) {
                                const updatedCartProductDetails = brandIds.map(async (product: any) => {
                                    if (couponDetails?.requestedData.couponApplyValues.includes((product.productId.toString()))) {
                                        couponAmountTotal = product.productAmount - couponAmount
                                        productId = product.productId
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

                if (shippingId) {

                }
                let cartUpdate = {
                    paymentMethodCharge: 0,
                    couponId: couponId,
                    totalCouponAmount: couponAmountTotal,
                    totalAmount: cart.totalAmount - couponAmountTotal,
                    shippingId: shippingId,
                    billingId: billingId
                }

                console.log("cartUpdatecartUpdate", cartUpdate);

                const paymentMethod: any = await PaymentMethodModel.findOne({ _id: paymentMethodId })
                if (paymentMethod && paymentMethod.slug == paymentMethods.cashOnDelivery) {
                    const codAmount: any = await WebsiteSetupModel.findOne({ blockReference: blockReferences.defualtSettings })
                    cartUpdate = {
                        ...cartUpdate,
                        paymentMethodCharge: codAmount.blockValues.codCharge
                    }

                } else if (paymentMethod && paymentMethod.slug == paymentMethods.tap) {

                }

                else if (paymentMethod && paymentMethod.slug == paymentMethods.tabby) {

                }

                if (couponCode) {

                    const updateCartProduct = await CartService.updateCartProduct(productId, { productAmount: couponAmountTotal })
                }
                const updateCart = await CartService.update(cart._id, cartUpdate)




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
}

export default new CheckoutController();
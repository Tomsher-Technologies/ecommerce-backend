import BaseController from "../../admin/base-controller";
import { Request, Response } from 'express';
import CommonService from '../../../services/frontend/guest/common-service'
import CartService from '../../../services/frontend/cart-service';
import PaymentMethodModel from "../../../model/admin/setup/payment-methods-model";
import { paymentMethods, orderPaymentStatus, tapPaymentGatwayStatus } from "../../../constants/cart";
import WebsiteSetupModel from "../../../model/admin/setup/website-setup-model";
import { blockReferences } from "../../../constants/website-setup";
import CouponService from "../../../services/frontend/auth/coupon-service";
import { checkoutSchema } from "../../../utils/schemas/frontend/auth/checkout-schema";
import { formatZodError } from "../../../utils/helpers";

import { tapPaymentRetrieve, tapPaymentCreate } from "../../../lib/tap-payment";
import CustomerModel from "../../../model/frontend/customers-model";
import { tabbyPaymentGatwayDefaultValues, tapPaymentGatwayDefaultValues } from "../../../utils/frontend/cart-utils";
import PaymentTransactionModel from "../../../model/frontend/payment-transaction-model";
import CheckoutService from "../../../services/frontend/checkout-service";
import CustomerAddress from "../../../model/frontend/customer-address-model";
import CartOrderProductsModel from "../../../model/frontend/cart-order-product-model";
import { tabbyPaymentCreate } from "../../../lib/tabby-payment";

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

                const cartDetails: any = await CartService.findCartPopulate({
                    query: {
                        $and: [
                            { customerId: customerId },
                            { countryId: countryData._id },
                            { cartStatus: "1" }
                        ],

                    },
                    hostName: req.get('origin'),
                })
                if (!cartDetails) {
                    return controller.sendErrorResponse(res, 500, { message: 'Cart not found!' });
                }

                let cartUpdate = {
                    paymentMethodCharge: 0,
                    couponId: null,
                    totalCouponAmount: 0,
                    totalAmount: cartDetails.totalAmount,
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

                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: couponDetails?.message,
                        });
                    }
                }

                cartUpdate = {
                    ...cartUpdate,
                    totalCouponAmount: 0,
                    totalAmount: cartDetails.totalAmount,
                }

                let paymentRedirectionUrl = ''
                if (paymentMethod.slug !== paymentMethods.cashOnDelivery) {
                    if (paymentMethod && paymentMethod.slug == paymentMethods.tap) {
                        const tapDefaultValues = tapPaymentGatwayDefaultValues(countryData, { ...cartUpdate, _id: cartDetails._id }, customerDetails);

                        const tapResponse = await tapPaymentCreate(tapDefaultValues);
                        if (tapResponse && tapResponse.status === tapPaymentGatwayStatus.initiated && tapResponse.id && tapResponse.transaction) {
                            const paymentTransaction = await PaymentTransactionModel.create({
                                transactionId: tapResponse.id,
                                orderId: cartDetails._id,
                                data: '',
                                orderStatus: orderPaymentStatus.pending, // Pending
                                createdAt: new Date(),
                            });
                            if (!paymentTransaction) {
                                return controller.sendErrorResponse(res, 500, { message: 'Something went wrong, Payment transaction is failed. Please try again' });
                            }
                            paymentRedirectionUrl = tapResponse.transaction.url
                        }

                    } else if (paymentMethod && paymentMethod.slug == paymentMethods.tabby) {
                        const shippingAddressDetails: any = await CustomerAddress.findById(shippingId);

                        // const cartProductsDetails: any = await CartOrderProductsModel.find({ cartId: cartDetails._id });
                     

                        const tabbyDefaultValues = tabbyPaymentGatwayDefaultValues(countryData, {
                            ...cartUpdate,
                            _id: cartDetails._id,
                            orderComments: cartDetails.orderComments,
                            cartStatusAt: cartDetails.cartStatusAt,
                            totalDiscountAmount: cartDetails.totalDiscountAmount,
                            totalTaxAmount: cartDetails.totalTaxAmount,
                            products: cartDetails?.products
                        }, customerDetails, paymentMethod, shippingAddressDetails);
                        const tapResponse = await tabbyPaymentCreate(tabbyDefaultValues);
                        console.log('tapResponse', tapResponse);
                    }
                } else {
                    const codAmount: any = await WebsiteSetupModel.findOne({ blockReference: blockReferences.defualtSettings })
                    cartUpdate = {
                        ...cartUpdate,
                        paymentMethodCharge: codAmount.blockValues.codCharge
                    }
                }

                const updateCart = await CartService.update(cartDetails._id, cartUpdate)
                if (!updateCart) {
                    return controller.sendErrorResponse(res, 500, { message: 'Something went wrong, Cart updation is failed. Please try again' });
                }
                return controller.sendSuccessResponse(res, {
                    requestedData: {
                        orderId: cartDetails._id,
                        orderType: paymentMethod.slug,
                        paymentRedirectionUrl
                    },
                    message: 'Order successfully Created!'
                }, 200);

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

    async tapSuccessResponse(req: Request, res: Response): Promise<any> {
        const { tap_id, data }: any = req.query
        if (!tap_id) {
            res.redirect("https://developers.tap.company/reference/retrieve-an-authorize?tap_id=fail"); // fail
            return false
        }
        const tapResponse = await tapPaymentRetrieve(tap_id);
        if (tapResponse.status) {
            const retValResponse = await CheckoutService.paymentResponse({
                transactionId: tap_id, allPaymentResponseData: data,
                paymentStatus: (tapResponse.status === tapPaymentGatwayStatus.authorized || tapResponse.status === tapPaymentGatwayStatus.captured) ?
                    orderPaymentStatus.success : ((tapResponse.status === tapPaymentGatwayStatus.cancelled) ? tapResponse.cancelled : orderPaymentStatus.failure)
            });

            if (retValResponse.status) {
                res.redirect("http://stackoverflow.com"); // success
                return true
            } else {
                res.redirect(`https://developers.tap.company/reference/retrieve-an-authorize?${retValResponse.message}`); // fail
                return false
            }
        }
    }
}

export default new CheckoutController();
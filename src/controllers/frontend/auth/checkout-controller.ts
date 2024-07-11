import BaseController from "../../admin/base-controller";
import { Request, Response } from 'express';
import CommonService from '../../../services/frontend/guest/common-service'
import CartService from '../../../services/frontend/cart-service';
import PaymentMethodModel from "../../../model/admin/setup/payment-methods-model";
import { paymentMethods, orderPaymentStatus, tapPaymentGatwayStatus, tabbyPaymentGatwaySuccessStatus, orderTypes, orderStatusMap, cartStatus } from "../../../constants/cart";
import WebsiteSetupModel from "../../../model/admin/setup/website-setup-model";
import { blockReferences } from "../../../constants/website-setup";
import CouponService from "../../../services/frontend/auth/coupon-service";
import { checkoutSchema } from "../../../utils/schemas/frontend/auth/checkout-schema";
import { formatZodError } from "../../../utils/helpers";
import { tabbyCheckoutRetrieve, tabbyPaymentCreate, tabbyPaymentRetrieve } from "../../../lib/tabby-payment";

import { tapPaymentRetrieve, tapPaymentCreate } from "../../../lib/tap-payment";
import CustomerModel from "../../../model/frontend/customers-model";
import { tabbyPaymentGatwayDefaultValues, tapPaymentGatwayDefaultValues } from "../../../utils/frontend/cart-utils";
import PaymentTransactionModel from "../../../model/frontend/payment-transaction-model";
import CheckoutService from "../../../services/frontend/checkout-service";
import CustomerAddress from "../../../model/frontend/customer-address-model";

const controller = new BaseController();

class CheckoutController extends BaseController {

    async checkout(req: Request, res: Response): Promise<void> {
        try {
            const customerId: any = res.locals.user._id;
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
                            { cartStatus: cartStatus.active }
                        ],
                    },
                    hostName: req.get('origin'),
                })

                if (!cartDetails) {
                    return controller.sendErrorResponse(res, 500, { message: 'Cart not found!' });
                }

                let cartUpdate: any = {
                    cartStatus: cartStatus.active,
                    paymentMethodCharge: 0,
                    couponId: null,
                    totalCouponAmount: 0,
                    totalAmount: cartDetails.totalAmount,
                    shippingId: shippingId,
                    billingId: billingId || null,
                    paymentMethodId: paymentMethod._id,
                    orderStatusAt: null,
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

                let paymentData = null
                if (paymentMethod.slug !== paymentMethods.cashOnDelivery) {
                    if (paymentMethod && paymentMethod.slug == paymentMethods.tap) {
                        const tapDefaultValues = tapPaymentGatwayDefaultValues(countryData, { ...cartUpdate, _id: cartDetails._id }, customerDetails, paymentMethod.paymentMethodValues);

                        const tapResponse = await tapPaymentCreate(tapDefaultValues, paymentMethod.paymentMethodValues);
                        if (tapResponse && tapResponse.status === tapPaymentGatwayStatus.initiated && tapResponse.id && tapResponse.transaction) {
                            const paymentTransaction = await PaymentTransactionModel.create({
                                paymentMethodId,
                                transactionId: tapResponse.id,
                                orderId: cartDetails._id,
                                data: '',
                                orderStatus: orderPaymentStatus.pending, // Pending
                                createdAt: new Date(),
                            });
                            if (!paymentTransaction) {
                                return controller.sendErrorResponse(res, 500, { message: 'Something went wrong, Payment transaction is failed. Please try again' });
                            }
                            paymentData = { paymentRedirectionUrl: tapResponse.transaction.url }
                        }

                    } else if (paymentMethod && paymentMethod.slug == paymentMethods.tabby) {
                        if (paymentMethod.paymentMethodValues) {
                            const shippingAddressDetails: any = await CustomerAddress.findById(shippingId);
                            // const cartProductsDetails: any = await CartOrderProductsModel.find({ cartId: cartDetails._id });
                            const tabbyDefaultValues = tabbyPaymentGatwayDefaultValues(countryData, {
                                ...cartUpdate,
                                _id: cartDetails._id,
                                orderComments: cartDetails.orderComments,
                                cartStatusAt: cartDetails.cartStatusAt,
                                totalDiscountAmount: cartDetails.totalDiscountAmount,
                                totalShippingAmount: cartDetails.totalShippingAmount,
                                totalTaxAmount: cartDetails.totalTaxAmount,
                                products: cartDetails?.products
                            },
                                customerDetails,
                                paymentMethod,
                                shippingAddressDetails);

                            const tabbyResponse = await tabbyPaymentCreate(tabbyDefaultValues, paymentMethod.paymentMethodValues);

                            if (tabbyResponse && tabbyResponse.payment) {
                                const paymentTransaction = await PaymentTransactionModel.create({
                                    paymentMethodId,
                                    transactionId: tabbyResponse.id,
                                    paymentId: tabbyResponse.payment.id,
                                    orderId: cartDetails._id,
                                    data: JSON.stringify(tabbyResponse),
                                    orderStatus: orderPaymentStatus.pending, // Pending
                                    createdAt: new Date(),
                                });
                                if (!paymentTransaction) {
                                    return controller.sendErrorResponse(res, 500, { message: 'Something went wrong, Payment transaction is failed. Please try again' });
                                }
                            } else {
                                return controller.sendErrorResponse(res, 500, { message: 'Something went wrong, Payment transaction is failed. Please try again' });
                            }

                            if (tabbyResponse && tabbyResponse.configuration && tabbyResponse.configuration.available_products && tabbyResponse.configuration.available_products.installments?.length > 0) {
                                paymentData = {
                                    transactionId: tabbyResponse.id,
                                    ...tabbyResponse.configuration.available_products
                                }
                            }
                        } else {
                            return controller.sendErrorResponse(res, 500, { message: 'Payment method values is incorrect. Please connect with cutomer care or try another payment methods' });
                        }
                    }
                } else {
                    const codAmount: any = await WebsiteSetupModel.findOne({ blockReference: blockReferences.defualtSettings });
                    cartUpdate = {
                        ...cartUpdate,
                        paymentMethodCharge: codAmount?.blockValues?.codCharge || 0,
                        cartStatus: "2",
                        orderStatus: orderStatusMap['1'].value,
                        orderStatusAt: new Date(),
                    }
                }

                const updateCart = await CartService.update(cartDetails._id, cartUpdate)
                if (!updateCart) {
                    return controller.sendErrorResponse(res, 500, { message: 'Something went wrong, Cart updation is failed. Please try again' });
                }
                if (paymentMethod && paymentMethod.slug == paymentMethods.cashOnDelivery) {
                    await CheckoutService.cartUpdation({ ...updateCart, products: cartDetails.products, customerDetails, paymentMethod }, true)
                }

                return controller.sendSuccessResponse(res, {
                    requestedData: {
                        orderId: updateCart._id,
                        orderType: paymentMethod.slug,
                        paymentData
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

    async tabbyCheckoutRetrieveDetails(req: Request, res: Response): Promise<any> {
        try {
            const tabbyId = req.params.tabby;

            let countryData = await CommonService.findOneCountrySubDomainWithId(req.get('origin'), true);
            if (!countryData) {
                return controller.sendErrorResponse(res, 500, { message: 'Country is missing' });
            }
            const paymentMethod: any = await PaymentMethodModel.findOne({ slug: paymentMethods.tabby })
            if (!paymentMethod) {
                return controller.sendErrorResponse(res, 500, { message: 'Something went wrong, payment method is not found' });
            }

            const tabbyResponse = await tabbyCheckoutRetrieve(tabbyId, paymentMethod.paymentMethodValues);

            if (tabbyResponse && tabbyResponse.configuration && tabbyResponse.configuration.available_products && tabbyResponse.configuration.available_products.installments?.length > 0) {
                const customerId: any = res.locals.user._id;
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
                return controller.sendSuccessResponse(res, {
                    requestedData: {
                        cartDetails,
                        orderType: orderTypes.tabby,
                        paymentData: tabbyResponse.configuration.available_products
                    },
                    message: 'Order successfully Created!'
                }, 200);
            }

        } catch (error: any) {

            return controller.sendErrorResponse(res, 200, {
                message: error.message || 'Some error occurred while get tabby payment details',
            });
        }
    }

    async tapSuccessResponse(req: Request, res: Response): Promise<any> {
        const { tap_id, data }: any = req.query
        if (!tap_id) {
            res.redirect("https://www.timehouse.store/order-response?status=failure"); // failure
            return false
        }
        const paymentDetails = await PaymentTransactionModel.findOne({ transactionId: tap_id });
        if (!paymentDetails) {
            res.redirect("https://www.timehouse.store/order-response?status=failure&message=Payment transaction. Please contact administrator"); // failure
        }
        const paymentMethod: any = await PaymentMethodModel.findOne({ _id: paymentDetails?.paymentMethodId });
        if (!paymentMethod) {
            res.redirect("https://www.timehouse.store/order-response?status=failure&message=Payment method not found. Please contact administrator"); // failure
        }
        const tapResponse = await tapPaymentRetrieve(tap_id, paymentMethod.paymentMethodValues);
        if (tapResponse.status) {
            const retValResponse = await CheckoutService.paymentResponse({
                paymentDetails,
                allPaymentResponseData: data,
                paymentStatus: (tapResponse.status === tapPaymentGatwayStatus.authorized || tapResponse.status === tapPaymentGatwayStatus.captured) ?
                    orderPaymentStatus.success : ((tapResponse.status === tapPaymentGatwayStatus.cancelled) ? tapResponse.cancelled : orderPaymentStatus.failure)
            });

            if (retValResponse.status) {
                res.redirect(`https://www.timehouse.store/order-response/${retValResponse?._id}?status=success`); // success
                return true
            } else {
                res.redirect(`https://www.timehouse.store/order-response/${retValResponse?._id}?status=${tapResponse?.status}`); // failure
                return false
            }
        } else {
            res.redirect(`https://www.timehouse.store/order-response?status=${tapResponse?.status}`); // failure
            return false
        }
    }

    async tabbySuccessResponse(req: Request, res: Response): Promise<any> {
        const { payment_id }: any = req.query
        if (!payment_id) {
            res.redirect("https://www.timehouse.store/order-response?status=failure"); // failure
            return false
        }
        const paymentDetails = await PaymentTransactionModel.findOne({ paymentId: payment_id });
        if (!paymentDetails) {
            res.redirect("https://www.timehouse.store/order-response?status=failure&message=Payment transaction. Please contact administrator"); // failure
        }
        const paymentMethod: any = await PaymentMethodModel.findOne({ _id: paymentDetails?.paymentMethodId })
        if (!paymentMethod) {
            res.redirect("https://www.timehouse.store/order-response?status=failure&message=Payment method not found. Please contact administrator"); // failure
        }
        const tabbyResponse = await tabbyPaymentRetrieve(payment_id, paymentMethod.paymentMethodValues);

        if (tabbyResponse.status) {
            const retValResponse = await CheckoutService.paymentResponse({
                paymentDetails,
                allPaymentResponseData: tabbyResponse,
                paymentStatus: (tabbyResponse.status === tabbyPaymentGatwaySuccessStatus.authorized || tabbyResponse.status === tabbyPaymentGatwaySuccessStatus.closed) ?
                    orderPaymentStatus.success : ((tabbyResponse.status === tabbyPaymentGatwaySuccessStatus.rejected) ? tabbyResponse.cancelled : orderPaymentStatus.expired)
            });

            if (retValResponse.status) {
                res.redirect(`https://www.timehouse.store/order-response/${retValResponse?._id}?status=success`); // success
                return true
            } else {
                res.redirect(`https://www.timehouse.store/order-response/${retValResponse?._id}?status=${tabbyResponse?.status}`); // failure
                return false
            }
        } else {
            res.redirect(`https://www.timehouse.store/order-response?status=${tabbyResponse?.status}`); // failure
            return false
        }
    }
}

export default new CheckoutController();
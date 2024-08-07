import mongoose from "mongoose";
import BaseController from "../../admin/base-controller";
import { Request, Response } from 'express';
import CommonService from '../../../services/frontend/guest/common-service'
import CartService from '../../../services/frontend/cart-service';
import PaymentMethodModel from "../../../model/admin/setup/payment-methods-model";
import { paymentMethods, orderPaymentStatus, tapPaymentGatwayStatus, tabbyPaymentGatwaySuccessStatus, orderTypes, orderStatusMap, cartStatus, networkPaymentGatwayStatus, tamaraPaymentGatwayStatus } from "../../../constants/cart";
import WebsiteSetupModel from "../../../model/admin/setup/website-setup-model";
import { blockReferences, shippingTypes } from "../../../constants/website-setup";
import CouponService from "../../../services/frontend/auth/coupon-service";
import { checkoutSchema } from "../../../utils/schemas/frontend/auth/checkout-schema";
import { formatZodError } from "../../../utils/helpers";
import { tabbyCheckoutRetrieve, tabbyPaymentCreate, tabbyPaymentRetrieve } from "../../../lib/payment-gateway/tabby-payment";

import { tapPaymentRetrieve, tapPaymentCreate } from "../../../lib/payment-gateway/tap-payment";
import CustomerModel from "../../../model/frontend/customers-model";
import { networkPaymentGatwayDefaultValues, tabbyPaymentGatwayDefaultValues, tamaraPaymentGatwayDefaultValues, tapPaymentGatwayDefaultValues } from "../../../utils/frontend/cart-utils";
import PaymentTransactionModel from "../../../model/frontend/payment-transaction-model";
import CheckoutService from "../../../services/frontend/checkout-service";
import CustomerAddress from "../../../model/frontend/customer-address-model";
import { networkAccessToken, networkCreateOrder, networkCreateOrderStatus } from "../../../lib/payment-gateway/network-payments";
import ProductVariantsModel from "../../../model/admin/ecommerce/product/product-variants-model";
import { tamaraAutoriseOrder, tamaraCheckout } from "../../../lib/payment-gateway/tamara-payments";
import CartOrdersModel from "../../../model/frontend/cart-order-model";

const controller = new BaseController();

class CheckoutController extends BaseController {

    async checkout(req: Request, res: Response): Promise<void> {
        try {
            const customerId: any = res.locals.user._id;
            let countryData = await CommonService.findOneCountrySubDomainWithId(req.get('origin'), true);
            if (!countryData) {
                return controller.sendErrorResponse(res, 200, { message: 'Country is missing' });
            }
            const validatedData = checkoutSchema.safeParse(req.body);
            if (validatedData.success) {
                const { notVerifyUser = false, deviceType, couponCode, paymentMethodId, shippingId, billingId, pickupStoreId = '', stateId = '', cityId = '', orderComments } = validatedData.data;

                const customerDetails = await CustomerModel.findOne({ _id: customerId });

                if (!customerDetails || (!notVerifyUser && !customerDetails.isVerified)) {
                    const message = !customerDetails
                        ? 'User is not found'
                        : 'User is not verified';
                    return controller.sendErrorResponse(res, 200, { message });
                }

                const paymentMethod: any = await PaymentMethodModel.findOne({ _id: paymentMethodId })
                if (!paymentMethod) {
                    return controller.sendErrorResponse(res, 200, { message: 'Something went wrong, payment method is not found' });
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
                });
                if (!cartDetails) {
                    return controller.sendErrorResponse(res, 200, { message: 'Current cart is missing, please add items and try agin' });
                }
                const uuid = req.header('User-Token');
                const variantIds = cartDetails.products.map((product: any) => product.variantId);
                // go to product variant model check 
                const variantQuantities = cartDetails.products.reduce((calculateQuantity: any, product: any) => {
                    calculateQuantity[product.variantId.toString()] = product.quantity;
                    return calculateQuantity;
                }, {});

                const productVariants = await ProductVariantsModel.find({
                    _id: { $in: variantIds }
                });
                const errorArray: any = []
                for (const variant of productVariants) {
                    const requiredQuantity = variantQuantities[variant._id.toString()];
                    var productTitle
                    if (variant.extraProductTitle) {
                        productTitle = variant.extraProductTitle
                    } else {
                        productTitle = cartDetails.products.find((product: any) => product.variantId === variant._id)?.productDetails?.productTitle
                    }
                    if (variant.quantity == 0) {
                        errorArray.push({ productTitle: productTitle, message: 'The product in your cart is now out of stock. Please remove it to proceed with your purchase or choose a different item.' })
                    } else if (variant.quantity < requiredQuantity) {
                        errorArray.push({ productTitle: productTitle, message: 'The quantity of the product in your cart exceeds the available stock. Please update the quantity.' })
                    }
                }

                if (errorArray.length > 0) {
                    return controller.sendErrorResponse(res, 200, {
                        validation: errorArray,
                        message: 'Validation error',
                    });
                }

                if (!cartDetails) {
                    return controller.sendErrorResponse(res, 200, { message: 'Cart not found!' });
                }

                let cartUpdate: any = {
                    orderUuid: uuid,
                    shippingId: shippingId || null,
                    billingId: billingId || null,
                    paymentMethodId: paymentMethod._id,
                    couponId: null,
                    pickupStoreId: pickupStoreId || null,
                    stateId: stateId || null,
                    cityId: cityId || null,
                    cartStatus: cartStatus.active,
                    paymentMethodCharge: 0,
                    orderComments: orderComments,
                    totalCouponAmount: 0,
                    totalAmount: cartDetails.totalAmount,
                    orderStatusAt: null,
                }
                if (!customerDetails?.isGuest && couponCode && deviceType) {
                    const query = {
                        countryId: countryData._id,
                        couponCode,
                    } as any;
                    const couponDetails: any = await CouponService.checkCouponCode({ query, user: customerId, deviceType, uuid });
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
                let shippingAddressDetails: any = null
                let paymentData = null;
                let shippingChargeDetails: any = null;
                let totalShippingAmount = cartDetails.totalShippingAmount || 0;
                if (!pickupStoreId && stateId) {
                    shippingChargeDetails = await WebsiteSetupModel.findOne({ blockReference: blockReferences.shipmentSettings, countryId: countryData._id });
                    if ((shippingChargeDetails.blockValues && shippingChargeDetails.blockValues.shippingType) && (shippingChargeDetails.blockValues.shippingType === shippingTypes[1])) {
                        const areaWiseDeliveryChargeValues = shippingChargeDetails.blockValues.areaWiseDeliveryChargeValues || []
                        if (areaWiseDeliveryChargeValues?.length > 0) {
                            const matchedValue = areaWiseDeliveryChargeValues.find((item: any) => {
                                if (item.stateId === stateId) {
                                    if (cityId) {
                                        return item.cityId === cityId;
                                    }
                                    return true;
                                }
                                return false;
                            });
                            if (matchedValue) {
                                const shippingCharge = matchedValue?.shippingCharge || 0;
                                const finalShippingCharge = Number(shippingCharge) > 0 ? ((cartDetails.totalProductAmount) - (Number(matchedValue.freeShippingThreshold)) > 0 ? 0 : shippingCharge) : 0;
                                cartUpdate = {
                                    ...cartUpdate,
                                    totalShippingAmount: finalShippingCharge,
                                    totalAmount: ((parseInt(cartDetails.totalAmount) - parseInt(totalShippingAmount)) + parseInt(finalShippingCharge)),
                                }
                                totalShippingAmount = finalShippingCharge;
                            }
                        }
                    }
                } else if (pickupStoreId) {
                    cartUpdate = {
                        ...cartUpdate,
                        totalShippingAmount: 0,
                        totalAmount: (parseInt(cartDetails.totalAmount) - parseInt(totalShippingAmount)),
                    }
                    totalShippingAmount = 0;
                } else if (shippingId) {
                    shippingAddressDetails = await CustomerAddress.findOne({ _id: new mongoose.Types.ObjectId(shippingId) });
                    if (shippingAddressDetails && shippingAddressDetails.country !== countryData.countryTitle) {
                        shippingChargeDetails = await WebsiteSetupModel.findOne({ blockReference: blockReferences.shipmentSettings, countryId: countryData._id });
                        if ((shippingChargeDetails.blockValues && shippingChargeDetails.blockValues.shippingType) && (shippingChargeDetails.blockValues.shippingType === shippingTypes[2])) {
                            const { internationalShippingCharge, internationalFreeShippingThreshold } = shippingChargeDetails.blockValues || null
                            if (internationalShippingCharge && Number(internationalShippingCharge) > 0) {
                                const finalShippingCharge = Number(internationalShippingCharge) > 0 ? ((cartDetails.totalProductAmount) - (Number(internationalFreeShippingThreshold)) > 0 ? 0 : internationalShippingCharge) : 0;
                                cartUpdate = {
                                    ...cartUpdate,
                                    totalShippingAmount: finalShippingCharge,
                                    totalAmount: ((parseInt(cartDetails.totalAmount) - parseInt(totalShippingAmount)) + parseInt(finalShippingCharge)),
                                }
                                totalShippingAmount = finalShippingCharge;
                            }
                        }
                    }
                }
                if ((paymentMethod.slug !== paymentMethods.cashOnDelivery && paymentMethod.slug !== paymentMethods.cardOnDelivery)) {
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
                                return controller.sendErrorResponse(res, 200, { message: 'Something went wrong, Payment transaction is failed. Please try again' });
                            }
                            paymentData = { paymentRedirectionUrl: tapResponse.transaction.url }
                        }

                    } else if (paymentMethod && (paymentMethod.slug == paymentMethods.tamara || paymentMethod.slug == paymentMethods.tabby)) {
                        if (paymentMethod.paymentMethodValues) {
                            if (!shippingAddressDetails && shippingId) {
                                shippingAddressDetails = await CustomerAddress.findById(shippingId);
                            }
                            const setPaymentDefualtValues = {
                                ...cartUpdate,
                                _id: cartDetails._id,
                                orderComments: cartDetails.orderComments,
                                cartStatusAt: cartDetails.cartStatusAt,
                                totalDiscountAmount: cartDetails.totalDiscountAmount,
                                totalShippingAmount: totalShippingAmount,
                                totalTaxAmount: cartDetails.totalTaxAmount,
                                products: cartDetails?.products
                            }

                            if (paymentMethod.slug == paymentMethods.tamara) {
                                let billingAddressDetails: any = null
                                if (billingId) {
                                    billingAddressDetails = await CustomerAddress.findById(billingId);
                                }
                                const tamaraDefaultValues = tamaraPaymentGatwayDefaultValues(
                                    countryData,
                                    setPaymentDefualtValues,
                                    customerDetails,
                                    shippingAddressDetails,
                                    billingAddressDetails
                                );
                                const tamaraResponse = await tamaraCheckout(tamaraDefaultValues, paymentMethod.paymentMethodValues);

                                if (!tamaraResponse) {
                                    return controller.sendErrorResponse(res, 200, { message: 'Something went wrong, Payment transaction is failed. Please try again' });
                                }
                                if (tamaraResponse.order_id && tamaraResponse.checkout_url) {
                                    const paymentTransaction = await PaymentTransactionModel.create({
                                        paymentMethodId,
                                        transactionId: tamaraResponse.order_id,
                                        paymentId: tamaraResponse.checkout_id,
                                        orderId: cartDetails._id,
                                        data: JSON.stringify(tamaraResponse),
                                        orderStatus: orderPaymentStatus.pending, // Pending
                                        createdAt: new Date(),
                                    });
                                    if (!paymentTransaction) {
                                        return controller.sendErrorResponse(res, 200, { message: 'Something went wrong, Payment transaction is failed. Please try again' });
                                    }
                                    paymentData = {
                                        paymentRedirectionUrl: tamaraResponse.checkout_url
                                    }
                                } else {
                                    return controller.sendErrorResponse(res, 200, { message: 'Something went wrong, Payment transaction is failed. Please try again' });
                                }
                            } else if (paymentMethod.slug == paymentMethods.tabby) {
                                const tabbyDefaultValues = tabbyPaymentGatwayDefaultValues(countryData, setPaymentDefualtValues,
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
                                        return controller.sendErrorResponse(res, 200, { message: 'Something went wrong, Payment transaction is failed. Please try again' });
                                    }
                                } else {
                                    return controller.sendErrorResponse(res, 200, { message: 'Something went wrong, Payment transaction is failed. Please try again' });
                                }

                                if (tabbyResponse && tabbyResponse.configuration && tabbyResponse.configuration.available_products && tabbyResponse.configuration.available_products.installments?.length > 0) {
                                    paymentData = {
                                        transactionId: tabbyResponse.id,
                                        ...tabbyResponse.configuration.available_products
                                    }
                                }
                            }
                        } else {
                            return controller.sendErrorResponse(res, 200, { message: 'Payment method values is incorrect. Please connect with cutomer care or try another payment methods' });
                        }
                    } else if (paymentMethod && paymentMethod.slug == paymentMethods.network) {
                        if (paymentMethod.paymentMethodValues) {
                            const networkResponse = await networkAccessToken(paymentMethod.paymentMethodValues);
                            if (networkResponse && networkResponse.access_token) {
                                const networkDefaultValues = networkPaymentGatwayDefaultValues(countryData, {
                                    ...cartUpdate,
                                    _id: cartDetails._id,
                                    orderComments: cartDetails.orderComments,
                                    cartStatusAt: cartDetails.cartStatusAt,
                                    totalDiscountAmount: cartDetails.totalDiscountAmount,
                                    totalShippingAmount: totalShippingAmount,
                                    totalTaxAmount: cartDetails.totalTaxAmount,
                                    products: cartDetails?.products
                                },
                                    customerDetails);

                                const networkResult = await networkCreateOrder(networkDefaultValues, networkResponse.access_token, paymentMethod.paymentMethodValues);
                                if (networkResult && networkResult._links && networkResult._links.payment) {
                                    const paymentTransaction = await PaymentTransactionModel.create({
                                        paymentMethodId,
                                        transactionId: networkResult._id,
                                        paymentId: networkResult.reference,
                                        orderId: cartDetails._id,
                                        data: JSON.stringify(networkResult),
                                        orderStatus: networkResult.pending, // Pending
                                        createdAt: new Date(),
                                    });
                                    if (!paymentTransaction) {
                                        return controller.sendErrorResponse(res, 200, { message: 'Something went wrong, Payment transaction is failed. Please try again' });
                                    }
                                    paymentData = { paymentRedirectionUrl: networkResult._links.payment?.href }
                                } else {
                                    return controller.sendErrorResponse(res, 200, { message: 'Something went wrong, Payment transaction is failed. Please try again' });
                                }
                            } else {
                                return controller.sendErrorResponse(res, 200, { message: 'Something went wrong, Payment transaction is failed. Please try again' });
                            }

                            if (networkResponse && networkResponse.configuration && networkResponse.configuration.available_products && networkResponse.configuration.available_products.installments?.length > 0) {
                                paymentData = {
                                    transactionId: networkResponse.id,
                                    ...networkResponse.configuration.available_products
                                }
                            }
                        } else {
                            return controller.sendErrorResponse(res, 200, { message: 'Payment method values is incorrect. Please connect with cutomer care or try another payment methods' });
                        }
                    }
                } else {
                    const codAmount: any = await WebsiteSetupModel.findOne({ blockReference: blockReferences.defualtSettings, countryId: cartDetails.countryId });
                    cartUpdate = {
                        ...cartUpdate,
                        totalAmount: (cartUpdate.totalAmount + Number(codAmount?.blockValues?.codCharge || 0)),
                        paymentMethodCharge: codAmount?.blockValues?.codCharge || 0,
                        cartStatus: "2",
                        orderStatus: orderStatusMap['1'].value,
                        isGuest: customerDetails.isGuest ?? false,
                        orderStatusAt: new Date(),
                    }
                }
                const updateCart = await CartOrdersModel.findByIdAndUpdate(cartDetails._id, cartUpdate, { new: true, useFindAndModify: false })
                if (!updateCart) {
                    return controller.sendErrorResponse(res, 200, { message: 'Something went wrong, Cart updation is failed. Please try again' });
                }
                if (paymentMethod && (paymentMethod.slug == paymentMethods.cashOnDelivery || paymentMethod.slug == paymentMethods.cardOnDelivery)) {
                    await CheckoutService.cartUpdation({ ...updateCart.toObject(), products: cartDetails.products, customerDetails, paymentMethod, shippingChargeDetails, shippingAddressDetails, countryData }, true)
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
            const paymentDetails: any = await PaymentTransactionModel.findOne({ transactionId: tabbyId });
            if (!paymentDetails) {
                return controller.sendErrorResponse(res, 200, { message: 'Payment details not found' });
            }

            let countryData = await CommonService.findOneCountrySubDomainWithId(req.get('origin'), true);
            if (!countryData) {
                return controller.sendErrorResponse(res, 200, { message: 'Country is missing' });
            }
            const paymentMethod: any = await PaymentMethodModel.findOne({ slug: paymentMethods.tabby, countryId: countryData._id })
            if (!paymentMethod) {
                return controller.sendErrorResponse(res, 200, { message: 'Something went wrong, payment method is not found' });
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
            res.redirect(`${process.env.APPURL}/order-response?status=failure`); // failure
            return false
        }
        const paymentDetails: any = await PaymentTransactionModel.findOne({ transactionId: tap_id });
        if (!paymentDetails) {
            res.redirect(`${process.env.APPURL}/order-response?status=failure&message=Payment transaction. Please contact administrator`); // failure
        }
        const paymentMethod: any = await PaymentMethodModel.findOne({ _id: paymentDetails?.paymentMethodId });
        if (!paymentMethod) {
            res.redirect(`${process.env.APPURL}/order-response?status=failure&message=Payment method not found. Please contact administrator`); // failure
        }
        const tapResponse = await tapPaymentRetrieve(tap_id, paymentMethod.paymentMethodValues);
        await PaymentTransactionModel.findByIdAndUpdate(
            paymentDetails._id,
            { $set: { data: tapResponse } },
            { new: true, runValidators: true }
        );
        if (tapResponse.status) {
            const retValResponse = await CheckoutService.paymentResponse({
                paymentDetails,
                allPaymentResponseData: data,
                paymentStatus: (tapResponse.status === tapPaymentGatwayStatus.authorized || tapResponse.status === tapPaymentGatwayStatus.captured) ?
                    orderPaymentStatus.success : ((tapResponse.status === tapPaymentGatwayStatus.cancelled) ? tapResponse.cancelled : orderPaymentStatus.failure)
            });

            if (retValResponse.status) {
                res.redirect(`${process.env.APPURL}/order-response/${retValResponse?._id}?status=success`); // success
                return true
            } else {
                res.redirect(`${process.env.APPURL}/order-response/${retValResponse?._id}?status=${tapResponse?.status}`); // failure
                return false
            }
        } else {
            res.redirect(`${process.env.APPURL}/order-response/${paymentDetails?.orderId}?status=${tapResponse?.status}`); // failure
            return false
        }
    }

    async networkPaymentResponse(req: Request, res: Response): Promise<any> {
        const { ref, data }: any = req.query
        if (!ref) {
            res.redirect(`${process.env.APPURL}/order-response?status=failure`); // failure
            return false
        }

        const paymentDetails: any = await PaymentTransactionModel.findOne({ paymentId: ref });

        if (!paymentDetails) {
            res.redirect(`${process.env.APPURL}/order-response?status=failure&message=Payment transaction. Please contact administrator`); // failure
        }

        const paymentMethod: any = await PaymentMethodModel.findOne({ _id: paymentDetails?.paymentMethodId });
        if (!paymentMethod) {
            res.redirect(`${process.env.APPURL}/order-response?status=failure&message=Payment method not found. Please contact administrator`); // failure
        }
        const networkAccesTokenResponse = await networkAccessToken(paymentMethod.paymentMethodValues);
        if (networkAccesTokenResponse && networkAccesTokenResponse.access_token) {
            const networkResponse = await networkCreateOrderStatus(networkAccesTokenResponse.access_token, paymentMethod.paymentMethodValues, ref);
            if (!networkResponse) {
                res.redirect(`${process.env.APPURL}/order-response/${paymentMethod?.orderId}?status=failure&message=Something went wrong on payment transaction. Please contact administrator`); // failure
                return false
            }
            await PaymentTransactionModel.findByIdAndUpdate(
                paymentDetails._id,
                { $set: { data: networkResponse } },
                { new: true, runValidators: true }
            );
            if (networkResponse._embedded && networkResponse._embedded.payment && networkResponse._embedded.payment.length > 0 && networkResponse._embedded.payment[0].state) {
                const status = networkResponse._embedded.payment[0].state;
                const retValResponse = await CheckoutService.paymentResponse({
                    paymentDetails,
                    allPaymentResponseData: data,
                    paymentStatus: (status !== networkPaymentGatwayStatus.failed) ?
                        orderPaymentStatus.success : ((status === networkPaymentGatwayStatus.failed) ? orderPaymentStatus.failure : orderPaymentStatus.failure)
                });
                if (retValResponse.status) {
                    res.redirect(`${process.env.APPURL}/order-response/${retValResponse?._id}?status=success`); // success
                    return true
                } else {
                    res.redirect(`${process.env.APPURL}/order-response/${retValResponse?._id}?status=${status}`); // failure
                    return false
                }
            } else {
                res.redirect(`${process.env.APPURL}/order-response/${paymentMethod?.orderId}?status=failure&message=Something went wrong on payment transaction. Please contact administrator`); // failure
                return false
            }

        } else {
            res.redirect(`${process.env.APPURL}/order-response/${paymentDetails?.orderId}?status=failure&message=Payment transaction. Please contact administrator`); // failure
            return false
        }
    }

    async tabbySuccessResponse(req: Request, res: Response): Promise<any> {
        const { payment_id }: any = req.query
        if (!payment_id) {
            res.redirect(`${process.env.APPURL}/order-response?status=failure`); // failure
            return false
        }
        const paymentDetails: any = await PaymentTransactionModel.findOne({ paymentId: payment_id });
        if (!paymentDetails) {
            res.redirect(`${process.env.APPURL}/order-response?status=failure&message=Payment transaction. Please contact administrator`); // failure
        }
        const paymentMethod: any = await PaymentMethodModel.findOne({ _id: paymentDetails?.paymentMethodId })
        if (!paymentMethod) {
            res.redirect(`${process.env.APPURL}/order-response?status=failure&message=Payment method not found. Please contact administrator`); // failure
        }
        const tabbyResponse = await tabbyPaymentRetrieve(payment_id, paymentMethod.paymentMethodValues);
        await PaymentTransactionModel.findByIdAndUpdate(
            paymentDetails._id,
            { $set: { data: tabbyResponse } },
            { new: true, runValidators: true }
        );
        if (tabbyResponse.status) {
            const retValResponse = await CheckoutService.paymentResponse({
                paymentDetails,
                allPaymentResponseData: tabbyResponse,
                paymentStatus: (tabbyResponse.status === tabbyPaymentGatwaySuccessStatus.authorized || tabbyResponse.status === tabbyPaymentGatwaySuccessStatus.closed) ?
                    orderPaymentStatus.success : ((tabbyResponse.status === tabbyPaymentGatwaySuccessStatus.rejected) ? orderPaymentStatus.cancelled : orderPaymentStatus.expired)
            });

            if (retValResponse.status) {
                res.redirect(`${process.env.APPURL}/order-response/${retValResponse?._id}?status=success`); // success
                return true
            } else {
                res.redirect(`${process.env.APPURL}/order-response/${retValResponse?._id}?status=${tabbyResponse?.status}`); // failure
                return false
            }
        } else {
            res.redirect(`${process.env.APPURL}/order-response/${paymentDetails?.orderId}?status=${tabbyResponse?.status}`); // failure
            return false
        }
    }
    async tamaraSuccessResponse(req: Request, res: Response): Promise<any> {
        const { orderId, paymentStatus }: any = req.query;
        if (!orderId) {
            res.redirect(`${process.env.APPURL}/order-response?status=${paymentStatus || 'failure'}`); // failure
            return false
        }
        const paymentDetails: any = await PaymentTransactionModel.findOne({ transactionId: orderId });
        if (!paymentDetails) {
            res.redirect(`${process.env.APPURL}/order-response?status=${paymentStatus || 'failure'}&message=Payment transaction. Please contact administrator`); // failure
        }
        const paymentMethod: any = await PaymentMethodModel.findOne({ _id: paymentDetails?.paymentMethodId }).select('_id paymentMethodValues')
        if (!paymentMethod) {
            res.redirect(`${process.env.APPURL}/order-response?status=${paymentStatus || 'failure'}&message=Payment method not found. Please contact administrator`); // failure
        }
        const tamaraResponse = await tamaraAutoriseOrder(orderId, paymentMethod.paymentMethodValues);
        if (!tamaraResponse) {
            res.redirect(`${process.env.APPURL}/order-response?status=${paymentStatus || 'failure'}&message=Tamara autorise not completed. Please contact administrator`); // failure
        }
        await PaymentTransactionModel.findByIdAndUpdate(
            paymentDetails._id,
            { $set: { data: tamaraResponse } },
            { new: true, runValidators: true }
        );
        if (tamaraResponse.status === tamaraPaymentGatwayStatus.authorised) {
            const retValResponse = await CheckoutService.paymentResponse({
                paymentDetails,
                allPaymentResponseData: tamaraResponse,
                paymentStatus: (tamaraResponse.status === tamaraPaymentGatwayStatus.authorised || tamaraResponse.status === tamaraPaymentGatwayStatus.approved) ?
                    orderPaymentStatus.success : ((tamaraResponse.status === tamaraPaymentGatwayStatus.declined) ? orderPaymentStatus.cancelled : orderPaymentStatus.expired)
            });
            if (retValResponse.status) {
                res.redirect(`${process.env.APPURL}/order-response/${retValResponse?._id}?status=success`); // success
                return true
            } else {
                res.redirect(`${process.env.APPURL}/order-response/${retValResponse?._id}?status=${paymentStatus}`); // failure
                return false
            }
        } else {
            res.redirect(`${process.env.APPURL}/order-response/${paymentDetails?.orderId}?status=${paymentStatus}`); // failure
            return false
        }

    }
}

export default new CheckoutController();
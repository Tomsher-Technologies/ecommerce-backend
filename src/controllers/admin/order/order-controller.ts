import 'module-alias/register';
import { Request, Response } from 'express';
import path from 'path';
const ejs = require('ejs');

import { calculateExpectedDeliveryDate, calculateWalletRewardPoints, dateConvertPm, formatZodError, getCountryId, handleFileUpload, slugify, stringToArray } from '../../../utils/helpers';

import BaseController from '../../../controllers/admin/base-controller';
import OrderService from '../../../services/admin/order/order-service'

import mongoose from 'mongoose';
import { OrderQueryParams } from '../../../utils/types/order';
import CartOrdersModel from '../../../model/frontend/cart-order-model';
import { orderStatusArray, orderStatusMessages } from '../../../constants/cart';
import CustomerWalletTransactionsModel from '../../../model/frontend/customer-wallet-transaction-model';
import settingsService from '../../../services/admin/setup/settings-service';
import { blockReferences, websiteSetup } from '../../../constants/website-setup';
import { earnTypes } from '../../../constants/wallet';
import CustomerService from '../../../services/frontend/customer-service';
import { mailChimpEmailGateway } from '../../../lib/emails/mail-chimp-sms-gateway';
import WebsiteSetupModel from '../../../model/admin/setup/website-setup-model';
import CartOrderProductsModel from '../../../model/frontend/cart-order-product-model';
import { pdfGenerator } from '../../../lib/pdf/pdf-generator';

const controller = new BaseController();

class OrdersController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, cartStatus = '', sortby = '', sortorder = '', keyword = '', countryId = '', customerId = '', pickupStoreId = '', paymentMethodId = '', couponId = '', orderFromDate, orderEndDate, processingFromDate, processingEndDate, packedFromDate, packedEndDate, shippedFromDate, shippedEndDate, deliveredFromDate, deliveredEndDate, canceledFromDate, canceledEndDate, returnedFromDate, returnedEndDate, refundedFromDate, refundedEndDate, partiallyShippedFromDate, partiallyShippedEndDate, onHoldFromDate, onHoldEndDate, failedFromDate, failedEndDate, completedFromDate, completedEndDate, pickupFromDate, pickupEndDate, cartFromDate, cartEndDate } = req.query as OrderQueryParams;
            let query: any = { _id: { $exists: true } };

            const userData = await res.locals.user;

            const country = getCountryId(userData);
            if (country) {
                query.countryId = country;
            } else if (countryId) {
                query.countryId = new mongoose.Types.ObjectId(countryId)
            }

            // if (status && status !== '') {
            //     query.status = { $in: Array.isArray(status) ? status : [status] };
            // } else {
            //     query.cartStatus = '1';
            // }

            query = { cartStatus: { $ne: "1" } }

            // { customerId: customerDetails._id },
            // { countryId: countryData._id },
            if (customerId) {
                query = {
                    ...query, customerId: new mongoose.Types.ObjectId(customerId)
                } as any;
            }

            if (cartStatus) {
                query = {
                    ...query, cartStatus: cartStatus
                } as any;
            }

            if (couponId) {
                query = {
                    ...query, couponId: new mongoose.Types.ObjectId(couponId)
                } as any;
            }

            if (paymentMethodId) {
                query = {
                    ...query, paymentMethodId: new mongoose.Types.ObjectId(paymentMethodId)
                } as any;
            }

            if (pickupStoreId) {
                query = {
                    ...query, pickupStoreId: new mongoose.Types.ObjectId(pickupStoreId)
                } as any;
            }

            if (orderFromDate || orderEndDate) {
                query.orderStatusAt = {
                    ...(orderFromDate && { $gte: new Date(orderFromDate) }),
                    ...(orderEndDate && { $lte: dateConvertPm(orderEndDate) })
                };

            }

            if (processingFromDate || processingEndDate) {
                query.processingStatusAt = {
                    ...(processingFromDate && { $gte: new Date(processingFromDate) }),
                    ...(processingEndDate && { $lte: dateConvertPm(processingEndDate) })
                };
            }

            if (packedFromDate || packedEndDate) {
                query.packedStatusAt = {
                    ...(packedFromDate && { $gte: new Date(packedFromDate) }),
                    ...(packedEndDate && { $lte: dateConvertPm(packedEndDate) })
                };
            }

            if (shippedFromDate || shippedEndDate) {
                query.shippedStatusAt = {
                    ...(shippedFromDate && { $gte: new Date(shippedFromDate) }),
                    ...(shippedEndDate && { $lte: dateConvertPm(shippedEndDate) })
                };

            }

            if (deliveredFromDate || deliveredEndDate) {
                query.deliveredStatusAt = {
                    ...(deliveredFromDate && { $gte: new Date(deliveredFromDate) }),
                    ...(deliveredEndDate && { $lte: dateConvertPm(deliveredEndDate) })
                };

            }
            if (canceledFromDate || canceledEndDate) {
                query.canceledStatusAt = {
                    ...(canceledFromDate && { $gte: new Date(canceledFromDate) }),
                    ...(canceledEndDate && { $lte: dateConvertPm(canceledEndDate) })
                };

            }
            if (returnedFromDate || returnedEndDate) {
                query.returnedStatusAt = {
                    ...(returnedFromDate && { $gte: new Date(returnedFromDate) }),
                    ...(returnedEndDate && { $lte: dateConvertPm(returnedEndDate) })
                };

            }
            if (refundedFromDate || refundedEndDate) {
                query.refundedStatusAt = {
                    ...(refundedFromDate && { $gte: new Date(refundedFromDate) }),
                    ...(refundedEndDate && { $lte: dateConvertPm(refundedEndDate) })
                };

            }

            if (partiallyShippedFromDate || partiallyShippedEndDate) {
                query.partiallyShippedStatusAt = {
                    ...(partiallyShippedFromDate && { $gte: new Date(partiallyShippedFromDate) }),
                    ...(partiallyShippedEndDate && { $lte: dateConvertPm(partiallyShippedEndDate) })
                };

            }

            if (onHoldFromDate || onHoldEndDate) {
                query.onHoldStatusAt = {
                    ...(onHoldFromDate && { $gte: new Date(onHoldFromDate) }),
                    ...(onHoldEndDate && { $lte: dateConvertPm(onHoldEndDate) })
                };

            }

            if (failedFromDate || failedEndDate) {
                query.failedStatusAt = {
                    ...(failedFromDate && { $gte: new Date(failedFromDate) }),
                    ...(failedEndDate && { $lte: dateConvertPm(failedEndDate) })
                };

            }

            if (completedFromDate || completedEndDate) {
                query.completedStatusAt = {
                    ...(completedFromDate && { $gte: new Date(completedFromDate) }),
                    ...(completedEndDate && { $lte: dateConvertPm(completedEndDate) })
                };

            }

            if (pickupFromDate || pickupEndDate) {
                query.pickupStatusAt = {
                    ...(pickupFromDate && { $gte: new Date(pickupFromDate) }),
                    ...(pickupEndDate && { $lte: dateConvertPm(pickupEndDate) })
                };

            }

            if (cartFromDate || cartEndDate) {
                query.cartStatusAt = {
                    ...(cartFromDate && { $gte: new Date(cartFromDate) }),
                    ...(cartEndDate && { $lte: dateConvertPm(cartEndDate) })
                };

            }


            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }

            const order = await OrderService.OrderList({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            return controller.sendSuccessResponse(res, {
                requestedData: order,
                // totalCount: await CouponService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching coupons' });
        }
    }

    async getOrderDetails(req: Request, res: Response): Promise<void> {
        try {
            const orderId = req.params.id;

            const orderDetails: any = await OrderService.OrderList({
                query: {
                    _id: new mongoose.Types.ObjectId(orderId)
                },
                getAddress: '1',
                getCartProducts: '1',
                hostName: req.get('origin'),
            })

            if (orderDetails && orderDetails?.length > 0) {
                return controller.sendSuccessResponse(res, {
                    requestedData: orderDetails[0],
                    message: 'Your Order is ready!'
                });
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Order not fount'
                });
            }

        } catch (error: any) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Order not fount'
            });

        }
    }

    async orderStatusChange(req: Request, res: Response): Promise<void> {
        try {
            const orderId = req.params.id;
            const orderStatus = req.body.orderStatus;

            const isValidStatus = orderStatusArray.some(status => status.value === orderStatus);

            if (!isValidStatus) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Invalid order status'
                });
            }

            const orderDetails: any = await CartOrdersModel.findById(orderId)
            if (!orderDetails) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Order not fount'
                });
            }
            // Ensure that the order cannot go back to a previous status once delivered
            if (orderDetails.orderStatus === '5' && ["1", "2", "3", "4", "9", "10", "13"].includes(orderStatus)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Cannot change the status back to a previous state once delivered'
                });
            }

            // Ensure that the order cannot be changed to Canceled after Delivered
            if (orderDetails.orderStatus === '5' && orderStatus === '6') {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Cannot change the status to Canceled once delivered'
                });
            }

            // Ensure that Returned status is only possible after Delivered
            if (orderStatus === '7' && orderDetails.orderStatus !== '5') {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Returned status is only possible after Delivered'
                });
            }

            if (orderStatus === '8' && orderDetails.orderStatus !== '7') {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Refunded status is only possible after Returned'
                });
            }

            if (orderStatus === '12' && orderDetails.orderStatus !== '5') {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Completed status is only possible after Delivered'
                });
            }

            // Ensure that the order cannot be changed from Completed to any other status
            if (orderDetails.orderStatus === '12') {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Cannot change the status once it is completed'
                });
            }
            let customerDetails: any = null;
            if (orderDetails.customerId) {
                const walletTransactionDetails = await CustomerWalletTransactionsModel.findOne({ orderId: orderDetails._id })
                customerDetails = await CustomerService.findOne({ _id: orderDetails?.customerId });
                if (customerDetails) {
                    if (orderStatus === '5' && !walletTransactionDetails) {
                        const walletsDetails = await settingsService.findOne({ countryId: orderDetails.countryId, block: websiteSetup.basicSettings, blockReference: blockReferences.wallets });
                        if ((walletsDetails) && (walletsDetails.blockValues) && (walletsDetails.blockValues.enableWallet) && (Number(walletsDetails.blockValues.orderAmount) > 0) && (orderDetails?.totalAmount >= Number(walletsDetails.blockValues.minimumOrderAmount))) {
                            const rewarDetails = calculateWalletRewardPoints(walletsDetails.blockValues, orderDetails.totalAmount)
                            await CustomerWalletTransactionsModel.create({
                                customerId: orderDetails.customerId,
                                orderId: orderDetails._id,
                                earnType: earnTypes.order,
                                walletAmount: rewarDetails.redeemableAmount,
                                walletPoints: rewarDetails.rewardPoints,
                                status: '1'
                            });
                            if (customerDetails) {
                                await CustomerService.update(customerDetails?._id, {
                                    totalRewardPoint: (customerDetails.totalRewardPoint + rewarDetails.rewardPoints),
                                    totalWalletAmount: (customerDetails.totalWalletAmount + rewarDetails.redeemableAmount)
                                });
                            }
                            orderDetails.rewardAmount = rewarDetails.redeemableAmount;
                            orderDetails.rewardPoints = rewarDetails.rewardPoints;
                        }
                    } else if ((orderStatus === '8' || orderStatus === '6') && walletTransactionDetails) {
                        await CustomerWalletTransactionsModel.findByIdAndUpdate(walletTransactionDetails._id, {
                            earnType: orderStatus === '8' ? earnTypes.orderReturned : earnTypes.orderCancelled,
                            status: '3' // rejected
                        });
                        await CustomerService.update(customerDetails?._id, {
                            totalRewardPoint: (customerDetails.totalRewardPoint - walletTransactionDetails.walletPoints),
                            totalWalletAmount: (customerDetails.totalWalletAmount - walletTransactionDetails.walletAmount)
                        });
                        orderDetails.rewardAmount = 0;
                        orderDetails.rewardPoints = 0;
                    }
                }
            }


            orderDetails.orderStatus = orderStatus;
            const currentDate = new Date();
            switch (orderStatus) {
                case '1': orderDetails.orderStatusAt = currentDate; break;
                case '2': orderDetails.processingStatusAt = currentDate; break;
                case '3': orderDetails.packedStatusAt = currentDate; break;
                case '4': orderDetails.shippedStatusAt = currentDate; break;
                case '5': orderDetails.deliveredStatusAt = currentDate; break;
                case '6': orderDetails.canceledStatusAt = currentDate; break;
                case '7': orderDetails.returnedStatusAt = currentDate; break;
                case '8': orderDetails.refundedStatusAt = currentDate; break;
                case '9': orderDetails.partiallyShippedStatusAt = currentDate; break;
                case '10': orderDetails.onHoldStatusAt = currentDate; break;
                case '11': orderDetails.failedStatusAt = currentDate; break;
                case '12': orderDetails.completedStatusAt = currentDate; break;
                case '13': orderDetails.pickupStatusAt = currentDate; break;
                default: break;
            }

            const updatedOrderDetails: any = await OrderService.orderStatusUpdate(orderDetails._id, orderDetails, '1');
            if (!updatedOrderDetails) {
                return controller.sendErrorResponse(res, 500, {
                    message: 'Something went wrong!'
                });
            }
            await CartOrderProductsModel.updateMany(
                { cartId: orderDetails._id },
                { $set: { orderStatus: orderStatus, orderStatusAt: currentDate } }
            );
            if (orderStatus === '4' || orderStatus === '5') {
                let query: any = { _id: { $exists: true } };
                query = {
                    ...query,
                    countryId: orderDetails.countryId,
                    block: websiteSetup.basicSettings,
                    blockReference: { $in: [blockReferences.defualtSettings, blockReferences.basicDetailsSettings] },
                    status: '1',
                } as any;

                const settingsDetails = await WebsiteSetupModel.find(query);
                const defualtSettings = settingsDetails?.find((setting: any) => setting.blockReference === blockReferences.defualtSettings);
                const basicDetailsSettings = settingsDetails?.find((setting: any) => setting.blockReference === blockReferences.basicDetailsSettings)?.blockValues;


                let commonDeliveryDays = '8';
                if (defualtSettings && defualtSettings.blockValues && defualtSettings.blockValues.commonDeliveryDays) {
                    commonDeliveryDays = defualtSettings.blockValues.commonDeliveryDays
                }
                const expectedDeliveryDate = calculateExpectedDeliveryDate(orderDetails.orderStatusAt, Number(commonDeliveryDays))
                ejs.renderFile(path.join(__dirname, '../../../views/email/order', orderStatus === '4' ? 'order-shipping-email.ejs' : 'order-delivered-email.ejs'), {
                    firstName: customerDetails?.firstName,
                    orderId: orderDetails.orderId,
                    totalAmount: orderDetails.totalAmount,
                    totalShippingAmount: orderDetails.totalShippingAmount,
                    totalProductAmount: orderDetails.totalProductAmount,
                    expectedDeliveryDate: expectedDeliveryDate,
                    storeEmail: basicDetailsSettings?.storeEmail,
                    products: updatedOrderDetails.products,
                    shopName: basicDetailsSettings?.shopName || `${process.env.SHOPNAME}`,
                    shopLogo: `${process.env.SHOPLOGO}`,
                    appUrl: `${process.env.APPURL}`
                }, async (err: any, template: any) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    await mailChimpEmailGateway({
                        subject: orderStatusMessages[orderStatus],
                        email: customerDetails?.email,
                    }, template)
                });
            }
            // console.log('aaaaaaaa', updatedOrderDetails);

            return controller.sendSuccessResponse(res, {
                requestedData: updatedOrderDetails,
                message: orderStatusMessages[orderStatus] || 'Order status updated successfully!'
            });
        } catch (error: any) {
            console.log('error', error);

            return controller.sendErrorResponse(res, 500, {
                message: 'Order not fount'
            });

        }
    }

    async getInvoice(req: Request, res: Response): Promise<void> {
        try {
            const orderId = req.params.id;

            const orderDetails: any = await OrderService.OrderList({
                query: {
                    _id: new mongoose.Types.ObjectId(orderId)
                },
                getAddress: '1',
                getCartProducts: '1',
                hostName: req.get('origin'),
            });
            if (orderDetails && orderDetails.length > 0) {
                let websiteSettingsQuery: any = { _id: { $exists: true } };
                websiteSettingsQuery = {
                    ...websiteSettingsQuery,
                    countryId: orderDetails[0].countryId,
                    block: websiteSetup.basicSettings,
                    blockReference: { $in: [blockReferences.defualtSettings, blockReferences.basicDetailsSettings] },
                    status: '1',
                } as any;

                const settingsDetails = await WebsiteSetupModel.find(websiteSettingsQuery);
                if (!settingsDetails) {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Settings details not fount'
                    });
                }
                const defualtSettings = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.defualtSettings);
                const basicDetailsSettings = settingsDetails?.find((setting: any) => setting?.blockReference === blockReferences.basicDetailsSettings)?.blockValues;

                if (!basicDetailsSettings) {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Basic details settings not fount'
                    });
                }

                let commonDeliveryDays = '6';
                if (defualtSettings && defualtSettings.blockValues && defualtSettings.blockValues.commonDeliveryDays) {
                    commonDeliveryDays = defualtSettings.blockValues.commonDeliveryDays
                }

                const expectedDeliveryDate = calculateExpectedDeliveryDate(orderDetails[0].orderStatusAt, Number(commonDeliveryDays))

                ejs.renderFile(path.join(__dirname, '../../../views/order', 'invoice-pdf.ejs'),
                    {
                        orderDetails: orderDetails[0],
                        expectedDeliveryDate,
                        storeEmail: basicDetailsSettings?.storeEmail,
                        storePhone: basicDetailsSettings?.storePhone,
                        storeAppartment: basicDetailsSettings?.storeAppartment,
                        storeStreet: basicDetailsSettings?.storeStreet,
                        storeCity: basicDetailsSettings?.storeCity,
                        storeState: basicDetailsSettings?.storeState,
                        storePostalCode: basicDetailsSettings?.storePostalCode,
                        shopName: basicDetailsSettings?.shopName || `${process.env.SHOPNAME}`,
                        shopLogo: `${process.env.SHOPLOGO}`,
                        appUrl: `${process.env.APPURL}`
                    },
                    async (err: any, html: any) => {
                        if (err) {
                            return controller.sendErrorResponse(res, 200, {
                                message: 'Error generating invoice'
                            });
                        }
                        await pdfGenerator({ html, res })
                    });
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Order not fount'
                });
            }
        } catch (error) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Error generating invoice'
            });
        }
    }




}

export default new OrdersController();


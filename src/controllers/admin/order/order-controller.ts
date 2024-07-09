import 'module-alias/register';
import { Request, Response } from 'express';

import {  calculateWalletRewardPoints, dateConvertPm, formatZodError, getCountryId, handleFileUpload, slugify, stringToArray } from '../../../utils/helpers';

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
            console.log('orderDetails', orderDetails);

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
            // // Ensure that the order cannot go back to a previous status once delivered
            // if (orderDetails.orderStatus === '5' && ["1", "2", "3", "4", "9", "10", "13"].includes(orderStatus)) {
            //     return controller.sendErrorResponse(res, 200, {
            //         message: 'Cannot change the status back to a previous state once delivered'
            //     });
            // }

            // // Ensure that the order cannot be changed to Canceled after Delivered
            // if (orderDetails.orderStatus === '5' && orderStatus === '6') {
            //     return controller.sendErrorResponse(res, 200, {
            //         message: 'Cannot change the status to Canceled once delivered'
            //     });
            // }

            // // Ensure that Returned status is only possible after Delivered
            // if (orderStatus === '7' && orderDetails.orderStatus !== '5') {
            //     return controller.sendErrorResponse(res, 200, {
            //         message: 'Returned status is only possible after Delivered'
            //     });
            // }

            // if (orderStatus === '8' && orderDetails.orderStatus !== '7') {
            //     return controller.sendErrorResponse(res, 200, {
            //         message: 'Refunded status is only possible after Returned'
            //     });
            // }

            // if (orderStatus === '12' && orderDetails.orderStatus !== '5') {
            //     return controller.sendErrorResponse(res, 200, {
            //         message: 'Completed status is only possible after Delivered'
            //     });
            // }

            // // Ensure that the order cannot be changed from Completed to any other status
            // if (orderDetails.orderStatus === '12') {
            //     return controller.sendErrorResponse(res, 200, {
            //         message: 'Cannot change the status once it is completed'
            //     });
            // }

            if (orderDetails.customerId) {
                const walletsDetails = await settingsService.findOne({ countryId: orderDetails.countryId, block: websiteSetup.basicSettings, blockReference: blockReferences.wallets });

                if ((walletsDetails) && (walletsDetails.blockValues) && (walletsDetails.blockValues.enableWallet) && (orderDetails?.totalAmount >= Number(walletsDetails.blockValues.minimumOrderAmount))) {
                    console.log('walletsDetails', calculateWalletRewardPoints(walletsDetails.blockValues, orderDetails.totalAmount));
                    // await CustomerWalletTransactionsModel.create({
                    //     customerId: orderDetails.customerId,
                    //     earnType: earnTypes.order,
                    //     walletAmount: walletsDetails.blockValues.orderAmount,
                    //     walletPoints: calculateRewardPoints(walletsDetails.blockValues, orderDetails.totalAmount),
                    //     status: '1'
                    // });
                }
            }

            orderDetails.orderStatus = orderStatus;
            switch (orderStatus) {
                case '1': orderDetails.orderStatusAt = new Date(); break;
                case '2': orderDetails.processingStatusAt = new Date(); break;
                case '3': orderDetails.packedStatusAt = new Date(); break;
                case '4': orderDetails.shippedStatusAt = new Date(); break;
                case '5': orderDetails.deliveredStatusAt = new Date(); break;
                case '6': orderDetails.canceledStatusAt = new Date(); break;
                case '7': orderDetails.returnedStatusAt = new Date(); break;
                case '8': orderDetails.refundedStatusAt = new Date(); break;
                case '9': orderDetails.partiallyShippedStatusAt = new Date(); break;
                case '10': orderDetails.onHoldStatusAt = new Date(); break;
                case '11': orderDetails.failedStatusAt = new Date(); break;
                case '12': orderDetails.completedStatusAt = new Date(); break;
                case '13': orderDetails.pickupStatusAt = new Date(); break;
                default: break;
            }

            const updatedOrderDetails = await OrderService.orderStatusUpdate(orderDetails._id, orderDetails)
            return controller.sendSuccessResponse(res, {
                requestedData: updatedOrderDetails,
                message: orderStatusMessages[orderStatus] || 'Order status updated successfully!'
            });
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, {
                message: 'Order not fount'
            });

        }
    }


}

export default new OrdersController();


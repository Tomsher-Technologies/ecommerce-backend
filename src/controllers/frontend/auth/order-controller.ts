import mongoose from "mongoose";
import { Request, Response, query } from 'express';

import BaseController from "../../admin/base-controller";
import { cartStatus, orderPaymentStatus, orderPaymentStatusMessages, orderProductCancelStatusJson, orderProductReturnQuantityStatusJson, orderProductReturnStatusJson, orderProductStatusJson, orderStatusArrayJson, paymentMethods } from "../../../constants/cart";

import CustomerModel from "../../../model/frontend/customers-model";
import CommonService from '../../../services/frontend/guest/common-service'
import OrderService from "../../../services/frontend/auth/order-service";
import CartOrdersModel from "../../../model/frontend/cart-order-model";
import CartOrderProductsModel from "../../../model/frontend/cart-order-product-model";
import PaymentTransactionModel from "../../../model/frontend/payment-transaction-model";
import PaymentMethodModel from "../../../model/admin/setup/payment-methods-model";
import ProductVariantsModel from "../../../model/admin/ecommerce/product/product-variants-model";

const controller = new BaseController();
class OrderController extends BaseController {

    async orderList(req: Request, res: Response): Promise<void> {
        try {
            const customerId: any = res.locals.user;
            let countryData = await CommonService.findOneCountrySubDomainWithId(req.get('origin'), true);
            if (!countryData) {
                return controller.sendErrorResponse(res, 200, { message: 'Country is missing' });
            }
            const customerDetails: any = await CustomerModel.findOne({ _id: customerId });
            if (!customerDetails) {
                return controller.sendErrorResponse(res, 200, { message: 'User is not found' });
            }

            const order: any = await OrderService.orderList({
                query: {
                    $and: [
                        { customerId: customerDetails._id },
                        { countryId: countryData._id },
                        { isGuest: customerDetails.isGuest ?? false },
                        { cartStatus: { $ne: "1" } }
                    ],

                },
                hostName: req.get('origin'),
                getCartProducts: '1',
            });
            if (order) {
                return controller.sendSuccessResponse(res, {
                    requestedData: order,
                    message: 'Your Order is ready!'
                });
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Order not fount'
                });
            }

        } catch (error: any) {
            console.log('error', error);

            return controller.sendErrorResponse(res, 200, {
                message: 'Order not fount'
            });

        }
    }
    async getOrder(req: Request, res: Response): Promise<void> {
        try {
            const customerId: any = res.locals.user;
            const orderId = req.params.id;
            const uuid = req.header('User-Token');
            const origin = req.get('origin');
            const { getReturnProduct = '0' } = req.query;

            let countryData = await CommonService.findOneCountrySubDomainWithId(origin, true);
            if (!countryData) {
                return controller.sendErrorResponse(res, 200, { message: 'Country is missing' });
            }

            if (!customerId && !uuid) {
                return controller.sendErrorResponse(res, 200, { message: 'Customer or guest user information is missing' });
            }

            let query: any = {
                $and: [
                    { countryId: countryData._id },
                    { _id: new mongoose.Types.ObjectId(orderId) }
                ]
            };

            if (customerId) {
                const customerDetails: any = await CustomerModel.findOne({ _id: customerId });
                if (!customerDetails) {
                    return controller.sendErrorResponse(res, 200, { message: 'User is not found' });
                }
                query.customerId = customerId;
                query.isGuest = false;
            } else if (uuid) {
                query.orderUuid = uuid;
                query.isGuest = true;
            }

            const order: any = await OrderService.orderList({
                query,
                hostName: origin,
                getAddress: '1',
                getCartProducts: '1',
                getReturnProduct,
            });

            if (order && order.length > 0) {
                let message = 'Your Order is ready!';
                if (order[0].cartStatus === cartStatus.active) {
                    const paymentDetails = await PaymentMethodModel.findOne({ countryId: countryData._id, slug: paymentMethods.tabby });
                    if (paymentDetails) {
                        const paymentLastTransaction = await PaymentTransactionModel.findOne({ paymentMethodId: paymentDetails._id, orderId: order[0]._id }).sort({ createdAt: -1 });
                        if (paymentLastTransaction) {
                            const paymentStatusMessageTemplate = orderPaymentStatusMessages[paymentLastTransaction.status as keyof typeof orderPaymentStatusMessages];
                            const paymentMethodTitle = paymentDetails.paymentMethodTitle || "Tabby";
                            const paymentStatusMessage = paymentStatusMessageTemplate.replace(/Tabby/g, paymentMethodTitle);
                            message = `Your order is ${paymentStatusMessage}.`;
                        }
                    }
                }
                return controller.sendSuccessResponse(res, {
                    requestedData: order[0],
                    message
                });
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Order not found'
                });
            }
        } catch (error: any) {
            return controller.sendErrorResponse(res, 200, {
                message: 'An error occurred while fetching the order'
            });
        }
    }

    async orderReturnAndEdit(req: Request, res: Response): Promise<void> {
        try {
            const customerId = res.locals.user;
            const orderId = req.params.id;
            const { orderProducts, returnReason } = req.body;

            if (returnReason === '') {
                return controller.sendErrorResponse(res, 200, { message: 'Return eeason is required' });
            }

            if (!orderProducts || orderProducts.length === 0) {
                return controller.sendErrorResponse(res, 200, { message: 'Please select the order product to return or edit' });
            }
            if (!customerId) {
                return controller.sendErrorResponse(res, 200, { message: 'Customer or guest user information is missing' });
            }
            const orderObjectId = new mongoose.Types.ObjectId(orderId);
            const customerObjectId = new mongoose.Types.ObjectId(customerId);
            const orderDetails = await CartOrdersModel.findOne({
                _id: orderObjectId,
                cartStatus: { $ne: cartStatus.active },
                orderStatus: { $ne: "0" }
            });
            if (!orderDetails) {
                return controller.sendErrorResponse(res, 200, { message: 'Order details not found!' });
            }


            if (Number(orderStatusArrayJson.delivered) > Number(orderDetails.orderStatus)) {
                return controller.sendErrorResponse(res, 200, { message: 'Your order has not been delivered yet! Please return after the product is delivered' });
            }
            const statusMessages: { [key: string]: string } = {
                [orderStatusArrayJson.canceled.toString()]: 'Your order has already been cancelled!',
                [orderStatusArrayJson.returned.toString()]: 'Your order has already been returned!',
                [orderStatusArrayJson.onHold.toString()]: 'Your order is on hold!',
                [orderStatusArrayJson.failed.toString()]: 'Your order has failed!'
            };
            if ([orderStatusArrayJson.canceled, orderStatusArrayJson.returned, orderStatusArrayJson.onHold, orderStatusArrayJson.failed].map(String).includes(orderDetails.orderStatus)) {
                return controller.sendErrorResponse(res, 200, { message: statusMessages[orderDetails.orderStatus] });
            }
            const orderProductDetails = await CartOrderProductsModel.find({ cartId: orderDetails._id });
            if (!orderProductDetails || orderProductDetails.length === 0) {
                return controller.sendErrorResponse(res, 200, { message: 'Your order product not found!' });
            }
            let shouldUpdateTotalProductAmount = false;
            let hasErrorOccurred = false;
            let errorMessage = ''
            const updateOperations = orderProducts.map((orderProduct: any) => {
                const productDetail = orderProductDetails.find(
                    (detail) => detail._id.toString() === orderProduct.orderProductId
                );
                if (!productDetail) {
                    if (!hasErrorOccurred) {
                        errorMessage = `Order product with ID ${orderProduct.orderProductId} not found`;
                        hasErrorOccurred = true;
                    }
                    return null;
                }

                if (![orderProductStatusJson.delivered].includes(productDetail.orderProductStatus)) {
                    if (!hasErrorOccurred) {
                        errorMessage = `Order product with ID ${orderProduct.orderProductId} cannot be updated as its status is not '5' or '13'`
                        hasErrorOccurred = true;
                    }
                    return null;
                }
                if (orderProduct.quantityChange && productDetail.orderRequestedProductQuantity) {
                    errorMessage = "You can't change quantity anymore. You are already changed the quantity"
                    hasErrorOccurred = true;
                }
                if (orderProduct.quantityChange && productDetail.quantity !== orderProduct.quantity) {
                    if (orderProduct.quantity < productDetail.quantity) {
                        shouldUpdateTotalProductAmount = true;
                    } else {
                        errorMessage = `You cant change quantity out of ${productDetail.quantity}`
                        hasErrorOccurred = true;
                    }
                }
                return {
                    updateOne: {
                        filter: { _id: new mongoose.Types.ObjectId(orderProduct.orderProductId) },
                        update: {
                            $set: {
                                ...(!orderProduct.quantityChange ? {
                                    orderProductReturnStatus: orderProductReturnStatusJson.pending,
                                    orderProductReturnStatusAt: new Date(),
                                } : {
                                    orderRequestedProductQuantity: shouldUpdateTotalProductAmount ? (orderProduct.quantity < productDetail.quantity ? orderProduct.quantity : null) : null,
                                    orderRequestedProductQuantityStatus: orderProductReturnQuantityStatusJson.pending,
                                    orderRequestedProductQuantityStatusAt: new Date(),
                                })
                            }
                        }
                    }
                };
            }).filter((op: any): op is { updateOne: any } => op !== null);
            if (hasErrorOccurred) {
                return controller.sendErrorResponse(res, 200, {
                    message: errorMessage
                });
            }

            if (updateOperations.length > 0) {
                await CartOrderProductsModel.bulkWrite(updateOperations);
                if (returnReason !== '') {
                    const newReturnReason = `[${new Date().toISOString()}] ${returnReason}`;
                    await CartOrdersModel.findOneAndUpdate(
                        { _id: orderDetails._id },
                        {
                            returnReason: orderDetails.returnReason 
                                ? `${orderDetails.returnReason}\n${newReturnReason}` 
                                : newReturnReason
                        }
                    );
                }
                const orderList = await OrderService.orderList({
                    query: {
                        $and: [
                            { customerId: customerObjectId },
                            { _id: orderObjectId }
                        ]
                    },
                    hostName: req.get('origin'),
                    getAddress: '1',
                    getCartProducts: '1',
                });
                if (orderList && orderList.length > 0) {
                    return controller.sendSuccessResponse(res, {
                        requestedData: orderList[0],
                        message: shouldUpdateTotalProductAmount ? 'Order product statuses and quantities updated successfully!' : 'Order product return updated successfully!'
                    });
                } else {
                    return controller.sendErrorResponse(res, 200, { message: 'Order not found' });
                }
            } else {
                return controller.sendErrorResponse(res, 400, {
                    message: 'No valid order products found to update'
                });
            }
        } catch (error) {
            return controller.sendErrorResponse(res, 500, { message: 'An error occurred while updating the order' });
        }
    }

    async orderCancel(req: Request, res: Response): Promise<void> {
        try {
            const customerId = res.locals.user;
            const orderId = req.params.id;
            const { cancelReason } = req.body;

            if (!cancelReason) {
                return controller.sendErrorResponse(res, 200, { message: 'Cancel reason is required' });
            }

            if (!customerId) {
                return controller.sendErrorResponse(res, 200, { message: 'Customer or guest user information is missing' });
            }

            const orderObjectId = new mongoose.Types.ObjectId(orderId);
            const customerObjectId = new mongoose.Types.ObjectId(customerId);

            const orderDetails = await CartOrdersModel.findOne({
                _id: orderObjectId,
                cartStatus: { $ne: "1" },
                orderStatus: { $ne: "0" }
            });

            if (!orderDetails) {
                return controller.sendErrorResponse(res, 200, { message: 'Order details not found!' });
            }

            if (Number(orderDetails.orderStatus) === 6) {
                return controller.sendErrorResponse(res, 200, { message: 'Your order are already cancelled!' });
            }

            if (Number(orderDetails.orderStatus) > 1) {
                return controller.sendErrorResponse(res, 200, { message: 'Your order has been processed. You cannot cancel this order now!' });
            }
            const cartOrderProducts = await CartOrderProductsModel.find({ cartId: orderObjectId });

            if (!cartOrderProducts || cartOrderProducts.length === 0) {
                return controller.sendErrorResponse(res, 200, { message: 'No products found in the order!' });
            }
            for (const product of cartOrderProducts) {
                const { variantId, quantity } = product;
                await ProductVariantsModel.findByIdAndUpdate(
                    variantId,
                    { $inc: { quantity: quantity } },
                    { new: true, useFindAndModify: false }
                );
            }

            await CartOrdersModel.findByIdAndUpdate(orderObjectId, { orderStatus: orderStatusArrayJson.canceled, canceledStatusAt: new Date(), cancelReason });
            await CartOrderProductsModel.updateMany(
                { cartId: orderObjectId },
                {
                    orderProductStatus: orderProductStatusJson.canceled,
                    orderProductStatusAt: new Date(),
                    orderRequestedProductCancelStatus: orderProductCancelStatusJson.pending,
                    orderRequestedProductCancelStatusAt: new Date(),
                },
                { new: true, useFindAndModify: false }
            );
            const orderList = await OrderService.orderList({
                query: {
                    $and: [
                        { customerId: customerObjectId },
                        { _id: orderObjectId }
                    ]
                },
                hostName: req.get('origin'),
                getAddress: '1',
                getCartProducts: '1',
            });

            if (orderList && orderList.length > 0) {
                return controller.sendSuccessResponse(res, {
                    requestedData: orderList,
                    message: 'Your order has been successfully cancelled!'
                });
            } else {
                return controller.sendErrorResponse(res, 200, { message: 'Order not found' });
            }
        } catch (error) {
            return controller.sendErrorResponse(res, 200, { message: 'An error occurred while cancelling the order' });
        }
    }
}

export default new OrderController();
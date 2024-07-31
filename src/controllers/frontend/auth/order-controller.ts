import BaseController from "../../admin/base-controller";
import { Request, Response, query } from 'express';
import CommonService from '../../../services/frontend/guest/common-service'
import CustomerModel from "../../../model/frontend/customers-model";
import mongoose from "mongoose";
import OrderService from "../../../services/frontend/auth/order-service";
import CartOrdersModel from "../../../model/frontend/cart-order-model";
import CartOrderProductsModel from "../../../model/frontend/cart-order-product-model";

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

            let countryData = await CommonService.findOneCountrySubDomainWithId(origin, true);
            if (!countryData) {
                return controller.sendErrorResponse(res, 200, { message: 'Country is missing' });
            }

            if (!customerId && !uuid) {
                return controller.sendErrorResponse(res, 200, { message: 'Customer or guest user information is missing' });
            }

            const query: any = {
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
            console.log('customerDetails', customerId);

            const order: any = await OrderService.orderList({
                query,
                hostName: origin,
                getAddress: '1',
                getCartProducts: '1',
            });

            if (order && order.length > 0) {
                return controller.sendSuccessResponse(res, {
                    requestedData: order[0],
                    message: 'Your Order is ready!'
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
            const { orderProducts, returnReson } = req.body;

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
                cartStatus: { $ne: "1" },
                orderStatus: { $ne: "0" }
            });
            if (!orderDetails) {
                return controller.sendErrorResponse(res, 200, { message: 'Order details not found!' });
            }
            if (Number(orderDetails.orderStatus) < 4) {
                return controller.sendErrorResponse(res, 200, { message: 'Your order has not been delivered yet! Please return after the product is delivered' });
            }
            if ([6, 7, 10, 11].includes(Number(orderDetails.orderStatus))) {
                const statusMessages: { [key: number]: string } = {
                    6: 'Your order has already been cancelled!',
                    7: 'Your order has already been cancelled!',
                    10: 'Your order is on hold!',
                    11: 'Your order has failed!'
                };
                return controller.sendErrorResponse(res, 200, { message: statusMessages[Number(orderDetails.orderStatus)] });
            }
            const orderProductDetails = await CartOrderProductsModel.find({ cartId: orderDetails._id });
            if (!orderProductDetails || orderProductDetails.length === 0) {
                return controller.sendErrorResponse(res, 200, { message: 'Your order product not found!' });
            }
            let shouldUpdateTotalProductAmount = false;
            let hasErrorOccurred = false;
            const updateOperations = orderProducts.map((orderProduct: any) => {
                const productDetail = orderProductDetails.find(
                    (detail) => detail._id.toString() === orderProduct.orderProductId
                );
                if (!productDetail) {
                    if (!hasErrorOccurred) {
                        controller.sendErrorResponse(res, 400, {
                            message: `Order product with ID ${orderProduct.orderProductId} not found`
                        });
                        hasErrorOccurred = true;
                    }
                    return null;
                }

                if (!['5'].includes(productDetail.orderProductStatus)) {
                    if (!hasErrorOccurred) {
                        controller.sendErrorResponse(res, 400, {
                            message: `Order product with ID ${orderProduct.orderProductId} cannot be updated as its status is not '5' or '13'`
                        });
                        hasErrorOccurred = true;
                    }
                    return null;
                }
                if (productDetail.quantity !== orderProduct.quantity) {
                    shouldUpdateTotalProductAmount = true;
                }
                return {
                    updateOne: {
                        filter: { _id: new mongoose.Types.ObjectId(orderProduct.orderProductId) },
                        update: {
                            $set: {
                                orderRequestedProductStatus: "6",
                                orderRequestedProductStatusAt: new Date(),
                                orderRequestedProductQuantity: shouldUpdateTotalProductAmount ? (orderProduct.quantity > 1 ? orderProduct.quantity : null) : null
                            }
                        }
                    }
                };
            }).filter((op: any): op is { updateOne: any } => op !== null);
            if (hasErrorOccurred) {
                return;
            }
            if (updateOperations.length > 0) {
                await CartOrderProductsModel.bulkWrite(updateOperations);
                if (returnReson !== '') {
                    await CartOrdersModel.findOneAndDelete(orderDetails._id, {
                        returnReson
                    })
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
                        message: 'Order product statuses and quantities updated successfully!'
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

            await CartOrdersModel.findByIdAndUpdate(orderObjectId, { orderStatus: "6" });

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
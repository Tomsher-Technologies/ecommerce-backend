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

    async orderReturn(req: Request, res: Response): Promise<void> {
        try {
            const customerId = res.locals.user;
            const orderId = req.params.id;
            const { orderProducts } = req.body;

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

            if (Number(orderDetails.orderStatus) > 1) {
                return controller.sendErrorResponse(res, 200, { message: 'Your order has been processed. You cannot cancel this order now!' });
            }

            const orderProductDetails = await CartOrderProductsModel.find({ cartId: orderDetails._id })

            if (orderProductDetails && orderProductDetails.length === 0) {
                return controller.sendErrorResponse(res, 200, { message: 'Your order product not found!' });
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
                    message: 'Your order has been successfully cancelled!'
                });
            } else {
                return controller.sendErrorResponse(res, 200, { message: 'Order not found' });
            }
        } catch (error) {
            return controller.sendErrorResponse(res, 200, { message: 'An error occurred while cancelling the order' });
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
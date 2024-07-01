import BaseController from "../../admin/base-controller";
import { Request, Response, query } from 'express';
import CommonService from '../../../services/frontend/guest/common-service'
import CartService from '../../../services/frontend/cart-service';
import ProductsModel from "../../../model/admin/ecommerce/product-model";
import CustomerModel from "../../../model/frontend/customers-model";
import mongoose from "mongoose";
import OrderService from "../../../services/frontend/auth/order-service";

const controller = new BaseController();

class OrderController extends BaseController {

    async orderList(req: Request, res: Response): Promise<void> {
        try {
            const customerId: any = res.locals.user;
            let countryData = await CommonService.findOneCountrySubDomainWithId(req.get('origin'), true);
            if (!countryData) {
                return controller.sendErrorResponse(res, 500, { message: 'Country is missing' });
            }
            const customerDetails: any = await CustomerModel.findOne({ _id: customerId });
            if (!customerDetails) {
                return controller.sendErrorResponse(res, 500, { message: 'User is not found' });
            }

            const order: any = await OrderService.orderList({
                query: {
                    $and: [
                        { customerId: customerDetails._id },
                        { countryId: countryData._id },
                        { cartStatus: { $ne: "1" } }
                    ],

                },
                hostName: req.get('origin'),
            })
            if (order) {
                return controller.sendSuccessResponse(res, {
                    requestedData: order,
                    message: 'Your Order is ready!'
                });
            } else {
                return controller.sendErrorResponse(res, 500, {
                    message: 'Order not fount'
                });
            }

        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, {
                message: 'Order not fount'
            });

        }
    }
    async getOrder(req: Request, res: Response): Promise<void> {
        try {
            const customerId: any = res.locals.user;
            const orderId = req.params.id;

            let countryData = await CommonService.findOneCountrySubDomainWithId(req.get('origin'), true);
            if (!countryData) {
                return controller.sendErrorResponse(res, 500, { message: 'Country is missing' });
            }
            const customerDetails: any = await CustomerModel.findOne({ _id: customerId });
            if (!customerDetails) {
                return controller.sendErrorResponse(res, 500, { message: 'User is not found' });
            }
            //offer - specification
            const order: any = await OrderService.orderDetails({
                query: {
                    $and: [
                        { customerId: customerDetails._id },
                        { countryId: countryData._id },
                        // { cartStatus: "2" },
                        { _id: new mongoose.Types.ObjectId(orderId) }
                    ],

                },
                hostName: req.get('origin'),
            })
            console.log(order);

            if (order) {
                return controller.sendSuccessResponse(res, {
                    requestedData: order,
                    message: 'Your Order is ready!'
                });
            } else {
                return controller.sendErrorResponse(res, 500, {
                    message: 'Order not fount'
                });
            }

        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, {
                message: 'Order not fount'
            });

        }
    }

}

export default new OrderController();
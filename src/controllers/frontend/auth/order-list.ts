import BaseController from "../../admin/base-controller";
import { Request, Response, query } from 'express';
import CommonService from '../../../services/frontend/guest/common-service'
import CartService from '../../../services/frontend/cart-service';
import ProductsModel from "../../../model/admin/ecommerce/product-model";
import CustomerModel from "../../../model/frontend/customers-model";

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

            const order: any = await CartService.findCartPopulate({
                query: {
                    $and: [
                        { customerId: customerDetails._id },
                        { countryId: countryData._id },
                        { cartStatus: "1" }
                    ],

                },
                hostName: req.get('origin'),
            })

            console.log("0000000000000", order);

        } catch (error: any) {


        }
    }


}

export default new OrderController();
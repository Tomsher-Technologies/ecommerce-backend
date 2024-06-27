import BaseController from "../../admin/base-controller";
import { Request, Response, query } from 'express';
import CommonService from '../../../services/frontend/guest/common-service'
import CartService from '../../../services/frontend/cart-service';

const controller = new BaseController();

class CheckoutController extends BaseController {

    async checkout(req: Request, res: Response): Promise<void> {
        try {
            const customerId = res.locals.user;
            let countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));

            const cart: any = await CartService.findCartPopulate({
                query: {
                    $and: [
                        { customerId: customerId },
                        { countryId: countryId },
                        { cartStatus: "1" }
                    ],

                },
                hostName: req.get('origin'),
            })

            console.log("*******", cart);

            

        } catch (error: any) {

            return controller.sendErrorResponse(res, 200, {
                message: error.message || 'Some error occurred while Checkout',
            });
        }
    }
}

export default new CheckoutController();
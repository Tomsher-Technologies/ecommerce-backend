import { Request, Response } from "express";

import BaseController from "../../admin/base-controller";
import CommonService from "../../../services/frontend/guest/common-service";
import CouponService from "../../../services/frontend/auth/coupon-service";
import { applyCouponSchema } from "../../../utils/schemas/frontend/auth/coupon.schema";
import { formatZodError } from "../../../utils/helpers";

const controller = new BaseController();

class CouponController extends BaseController {

    async findAllCoupon(req: Request, res: Response): Promise<void> {
        try {
            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                let query: any = { _id: { $exists: true } };
                const currentDate = new Date(); 
                query = {
                    ...query,
                    countryId,
                    status: '1',
                    $and: [
                        { "discountDateRange.0": { $lte: currentDate } },
                        { "discountDateRange.1": { $gte: currentDate } },
                    ],
                } as any;

                const coupon = await CouponService.findAll({
                    query,
                    hostName: req.get('origin'),
                });

                controller.sendSuccessResponse(res, {
                    requestedData: coupon,
                    message: 'Success!'
                }, 200);

            } else {
                return controller.sendErrorResponse(res, 500, {
                    message: 'Country is missing'
                });
            }

        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching wishlist products' });
        }

    }
    async applyCoupon(req: Request, res: Response): Promise<void> {
        try {
            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                const couponCode = req.params.couponcode;
                if (couponCode) {
                    const validatedData = applyCouponSchema.safeParse(req.body);
                    if (validatedData.success) {
                        const { deviceType } = validatedData.data;

                        const query = {
                            countryId,
                            couponCode,
                        } as any;

                        const user = res.locals.user;
                        const couponDetails: any = await CouponService.checkCouponCode({ query, user, deviceType });
                        if (couponDetails?.status) {
                            console.log('here',couponDetails);
                            
                            return controller.sendSuccessResponse(res, {
                                requestedData: couponDetails?.requestedData,
                                message: couponDetails.message
                            }, 200);

                        } else {
                            return controller.sendErrorResponse(res, 200, {
                                message: couponDetails?.message,
                            });
                        }
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Validation error',
                            validation: formatZodError(validatedData.error.errors)
                        });
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                        validation: {
                            couponCode: "Coupon code is required"
                        }
                    });
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Country is missing'
                });
            }
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while apply coupon' });
        }
    }

}
export default new CouponController();
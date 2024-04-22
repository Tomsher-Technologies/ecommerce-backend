import 'module-alias/register';
import { Request, Response } from 'express';

import { formatZodError } from '@utils/helpers';
import { couponSchema } from '@utils/schemas/admin/marketing/coupon-schema';
import { QueryParams } from '@utils/types/common';

import BaseController from '@controllers/admin/base-controller';
import CouponService from '@services/admin/marketing/coupon-service'

const controller = new BaseController();

class CouponsController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, status = ['1', '2'], sortby = '', sortorder = '', keyword = '' } = req.query as QueryParams; 
            let query: any = { _id: { $exists: true } };

            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            } else {
                query.status = '1';
            }

            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = { 
                    $or: [
                        { couponType: keywordRegex }
                    ],
                    ...query
                } as any;
            }
            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }

            const coupons = await CouponService.findAll({ 
                page: parseInt(page_size as string), 
                limit: parseInt(limit as string), 
                query,
                sort
             });

            controller.sendSuccessResponse(res, {
                requestedData: coupons,
                totalCount: await CouponService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching coupons' });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = couponSchema.safeParse(req.body);

            if (validatedData.success) {
                const { couponType, couponCode, couponUseType, couponProducts, discountType, discount, discountDateRange } = validatedData.data;
                const user = res.locals.user;

                const couponData = {
                    couponType,
                    couponCode,
                    couponUseType,
                    couponProducts,
                    discountType,
                    discount,
                    discountDateRange,
                    status: '1',
                    createdBy: user._id,
                    createdAt: new Date()
                };
                const newCoupon = await CouponService.create(couponData);
                return controller.sendSuccessResponse(res, {
                    requestedData: newCoupon,
                    message: 'Coupon created successfully!'
                });
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) {
            if (error.code === 11000 && error.keyPattern && error.keyPattern.couponType) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        couponType: "Coupon name already exists"
                    }
                }, req);
            }
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating coupon',
            }, req);
        }
    }


    async findOne(req: Request, res: Response): Promise<void> {
        try {
            const couponId = req.params.id;
            if (couponId) {
                const coupon = await CouponService.findOne(couponId);
                controller.sendSuccessResponse(res, {
                    requestedData: coupon,
                    message: 'Success'
                });
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Coupon Id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = couponSchema.safeParse(req.body);
            if (validatedData.success) {
                const couponId = req.params.id;
                if (couponId) {
                    let updatedCouponData = req.body;
                    updatedCouponData = {
                        ...updatedCouponData,
                        updatedAt: new Date()
                    };

                    const updatedCoupon = await CouponService.update(couponId, updatedCouponData);
                    if (updatedCoupon) {
                        controller.sendSuccessResponse(res, {
                            requestedData: updatedCoupon,
                            message: 'Coupon updated successfully!'
                        });
                    } else {
                        controller.sendErrorResponse(res, 200, {
                            message: 'Coupon Id not found!',
                        }, req);
                    }
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Coupon Id not found! Please try again with coupon id',
                    }, req);
                }
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating coupon'
            }, req);
        }
    }

    async destroy(req: Request, res: Response): Promise<void> {
        try {
            const couponId = req.params.id;
            if (couponId) {
                const coupon = await CouponService.findOne(couponId);
                if (coupon) {
                    await CouponService.destroy(couponId);
                    controller.sendSuccessResponse(res, { message: 'Coupon deleted successfully!' });
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'This coupon details not found!',
                    });
                }
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Coupon id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting coupon' });
        }
    }

}

export default new CouponsController();
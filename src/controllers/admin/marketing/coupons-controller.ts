import 'module-alias/register';
import { Request, Response } from 'express';

import { dateConvertPm, formatZodError, getCountryId } from '../../../utils/helpers';
import { couponSchema, couponStatusSchema } from '../../../utils/schemas/admin/marketing/coupon-schema';
import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from '../../../constants/admin/task-log';
import { QueryParams } from '../../../utils/types/common';

import BaseController from '../../../controllers/admin/base-controller';
import CouponService from '../../../services/admin/marketing/coupon-service'

const controller = new BaseController();

class CouponsController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '' } = req.query as QueryParams;
            let query: any = { _id: { $exists: true } };
            let queryDate: any;
            const userData = await res.locals.user;
            const countryId = getCountryId(userData);
            if (countryId) {
                query.countryId = countryId;
            }

            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            } else {
                query.status = '1';
            }

            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = {
                    $or: [
                        { couponType: keywordRegex },
                        { couponCode: keywordRegex }

                    ],
                    ...query
                } as any;
            }

            if (query.fromDate || query.endDate) {
                if (query.fromDate) {
                    queryDate = {
                        ...queryDate,
                        createdAt: {
                            $gte: new Date(query.fromDate)
                        }
                    }
                }
                if (query.endDate) {
                    queryDate = {
                        ...queryDate,
                        createdAt: {
                            $lte: dateConvertPm(query.endDate)
                        }
                    }
                }

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

            return controller.sendSuccessResponse(res, {
                requestedData: coupons,
                totalCount: await CouponService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching coupons' });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = couponSchema.safeParse(req.body);

            if (validatedData.success) {
                const { countryId, couponCode, status, couponDescription, couponType, couponApplyValues, minPurchaseValue, discountType, discountAmount, discountMaxRedeemAmount, couponUsage, enableFreeShipping, discountDateRange } = validatedData.data;
                const user = res.locals.user;

                const couponData = {
                    countryId: countryId || getCountryId(user),
                    couponCode, couponDescription, couponType, couponApplyValues, minPurchaseValue, discountType, discountAmount, discountMaxRedeemAmount, couponUsage, enableFreeShipping, discountDateRange,
                    status: status || '1',
                    createdBy: user._id,
                    createdAt: new Date()
                };
                const newCoupon = await CouponService.create(couponData);
                return controller.sendSuccessResponse(res, {
                    requestedData: newCoupon,
                    message: 'Coupon created successfully!'
                }, 200, { // task log
                    sourceFromId: newCoupon._id,
                    sourceFrom: adminTaskLog.marketing.coupons,
                    activity: adminTaskLogActivity.create,
                    activityStatus: adminTaskLogStatus.success
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
                return controller.sendSuccessResponse(res, {
                    requestedData: coupon,
                    message: 'Success'
                });
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Coupon Id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
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
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedCoupon,
                            message: 'Coupon updated successfully!'
                        }, 200, { // task log
                            sourceFromId: updatedCoupon._id,
                            sourceFrom: adminTaskLog.marketing.coupons,
                            activity: adminTaskLogActivity.update,
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Coupon Id not found!',
                        }, req);
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Coupon Id not found! Please try again with coupon id',
                    }, req);
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating coupon'
            }, req);
        }
    }

    async statusChange(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = couponStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const couponId = req.params.id;
                if (couponId) {
                    let { status } = req.body;
                    const updatedCouponData = { status };

                    const updatedCoupon = await CouponService.update(couponId, updatedCouponData);
                    if (updatedCoupon) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedCoupon,
                            message: 'Coupon status updated successfully!'
                        }, 200, { // task log
                            sourceFromId: updatedCoupon._id,
                            sourceFrom: adminTaskLog.marketing.coupons,
                            activity: adminTaskLogActivity.statusChange,
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Coupon Id not found!',
                        }, req);
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Coupon Id not found! Please try again with coupon id',
                    }, req);
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, {
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
                    // await CouponService.destroy(couponId);
                    // controller.sendSuccessResponse(res, { message: 'Coupon deleted successfully!' });
                    return controller.sendErrorResponse(res, 200, {
                        message: 'You cant delete this coupon',
                    });
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'This coupon details not found!',
                    });
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Coupon id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting coupon' });
        }
    }

}

export default new CouponsController();
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const helpers_1 = require("../../../utils/helpers");
const coupon_schema_1 = require("../../../utils/schemas/admin/marketing/coupon-schema");
const task_log_1 = require("../../../constants/admin/task-log");
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const coupon_service_1 = __importDefault(require("../../../services/admin/marketing/coupon-service"));
const controller = new base_controller_1.default();
class CouponsController extends base_controller_1.default {
    async findAll(req, res) {
        try {
            const { page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '' } = req.query;
            let query = { _id: { $exists: true } };
            const { couponFromDate, couponEndDate } = req.query;
            const userData = await res.locals.user;
            const countryId = (0, helpers_1.getCountryId)(userData);
            if (countryId) {
                query.countryId = countryId;
            }
            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            }
            else {
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
                };
            }
            console.log("---------------------------", couponFromDate);
            const discountStartDate = new Date(couponFromDate);
            const discountEndDate = new Date(couponEndDate);
            if (couponFromDate || couponEndDate) {
                if (couponFromDate) {
                    query = {
                        ...query,
                        'discountDateRange.0': { $lte: discountStartDate },
                        'discountDateRange.1': { $gte: discountStartDate }
                    };
                }
                // if (couponEndDate) {
                //     query = {
                //         ...query,
                //         discountDateRange: {
                //             $lte: dateConvertPm(discountEndDate)
                //         }
                //     }
                // }
            }
            const sort = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            console.log("************************", query);
            const coupons = await coupon_service_1.default.findAll({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort
            });
            return controller.sendSuccessResponse(res, {
                requestedData: coupons,
                totalCount: await coupon_service_1.default.getTotalCount(query),
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching coupons' });
        }
    }
    async create(req, res) {
        try {
            const validatedData = coupon_schema_1.couponSchema.safeParse(req.body);
            if (validatedData.success) {
                const { countryId, couponCode, status, couponDescription, couponType, couponApplyValues, minPurchaseValue, discountType, discountAmount, discountMaxRedeemAmount, couponUsage, enableFreeShipping, discountDateRange } = validatedData.data;
                const user = res.locals.user;
                const couponData = {
                    countryId: countryId || (0, helpers_1.getCountryId)(user),
                    couponCode, couponDescription, couponType, couponApplyValues, minPurchaseValue, discountType, discountAmount, discountMaxRedeemAmount, couponUsage, enableFreeShipping, discountDateRange,
                    status: status || '1',
                    createdBy: user._id,
                    createdAt: new Date()
                };
                const newCoupon = await coupon_service_1.default.create(couponData);
                return controller.sendSuccessResponse(res, {
                    requestedData: newCoupon,
                    message: 'Coupon created successfully!'
                }, 200, {
                    sourceFromId: newCoupon._id,
                    sourceFrom: task_log_1.adminTaskLog.marketing.coupons,
                    activity: task_log_1.adminTaskLogActivity.create,
                    activityStatus: task_log_1.adminTaskLogStatus.success
                });
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                }, req);
            }
        }
        catch (error) {
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
    async findOne(req, res) {
        try {
            const couponId = req.params.id;
            if (couponId) {
                const coupon = await coupon_service_1.default.findOne(couponId);
                return controller.sendSuccessResponse(res, {
                    requestedData: coupon,
                    message: 'Success'
                });
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Coupon Id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
    async update(req, res) {
        try {
            const validatedData = coupon_schema_1.couponSchema.safeParse(req.body);
            if (validatedData.success) {
                const couponId = req.params.id;
                if (couponId) {
                    let updatedCouponData = req.body;
                    updatedCouponData = {
                        ...updatedCouponData,
                        updatedAt: new Date()
                    };
                    const updatedCoupon = await coupon_service_1.default.update(couponId, updatedCouponData);
                    if (updatedCoupon) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedCoupon,
                            message: 'Coupon updated successfully!'
                        }, 200, {
                            sourceFromId: updatedCoupon._id,
                            sourceFrom: task_log_1.adminTaskLog.marketing.coupons,
                            activity: task_log_1.adminTaskLogActivity.update,
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Coupon Id not found!',
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Coupon Id not found! Please try again with coupon id',
                    }, req);
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                }, req);
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating coupon'
            }, req);
        }
    }
    async statusChange(req, res) {
        try {
            const validatedData = coupon_schema_1.couponStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const couponId = req.params.id;
                if (couponId) {
                    let { status } = req.body;
                    const updatedCouponData = { status };
                    const updatedCoupon = await coupon_service_1.default.update(couponId, updatedCouponData);
                    if (updatedCoupon) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedCoupon,
                            message: 'Coupon status updated successfully!'
                        }, 200, {
                            sourceFromId: updatedCoupon._id,
                            sourceFrom: task_log_1.adminTaskLog.marketing.coupons,
                            activity: task_log_1.adminTaskLogActivity.statusChange,
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Coupon Id not found!',
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Coupon Id not found! Please try again with coupon id',
                    }, req);
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                }, req);
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating coupon'
            }, req);
        }
    }
    async destroy(req, res) {
        try {
            const couponId = req.params.id;
            if (couponId) {
                const coupon = await coupon_service_1.default.findOne(couponId);
                if (coupon) {
                    // await CouponService.destroy(couponId);
                    // controller.sendSuccessResponse(res, { message: 'Coupon deleted successfully!' });
                    return controller.sendErrorResponse(res, 200, {
                        message: 'You cant delete this coupon',
                    });
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'This coupon details not found!',
                    });
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Coupon id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting coupon' });
        }
    }
}
exports.default = new CouponsController();

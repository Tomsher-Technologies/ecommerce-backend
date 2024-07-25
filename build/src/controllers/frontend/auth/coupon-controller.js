"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_controller_1 = __importDefault(require("../../admin/base-controller"));
const common_service_1 = __importDefault(require("../../../services/frontend/guest/common-service"));
const coupon_service_1 = __importDefault(require("../../../services/frontend/auth/coupon-service"));
const coupon_schema_1 = require("../../../utils/schemas/frontend/auth/coupon.schema");
const helpers_1 = require("../../../utils/helpers");
const controller = new base_controller_1.default();
class CouponController extends base_controller_1.default {
    async findAllCoupon(req, res) {
        try {
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                let query = { _id: { $exists: true } };
                const currentDate = new Date();
                query = {
                    ...query,
                    countryId,
                    status: '1',
                    $and: [
                        { "discountDateRange.0": { $lte: currentDate } },
                        { "discountDateRange.1": { $gte: currentDate } },
                    ],
                };
                const coupon = await coupon_service_1.default.findAll({
                    query,
                    hostName: req.get('origin'),
                });
                controller.sendSuccessResponse(res, {
                    requestedData: coupon,
                    message: 'Success!'
                }, 200);
            }
            else {
                return controller.sendErrorResponse(res, 500, {
                    message: 'Country is missing'
                });
            }
        }
        catch (error) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching wishlist products' });
        }
    }
    async applyCoupon(req, res) {
        try {
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                const couponCode = req.params.couponcode;
                if (couponCode) {
                    const validatedData = coupon_schema_1.applyCouponSchema.safeParse(req.body);
                    if (validatedData.success) {
                        const { deviceType } = validatedData.data;
                        const query = {
                            countryId,
                            couponCode,
                        };
                        const user = res.locals.user;
                        // const customerDetails = await CustomerModel.findOne({ _id: user });
                        // if (!customerDetails || customerDetails?.isGuest === true || !customerDetails?.isVerified) {
                        //     const message = !customerDetails
                        //         ? 'User is not found'
                        //         : customerDetails.isGuest === true
                        //             ? 'User is a guest and not eligible'
                        //             : 'User is not verified';
                        //     return controller.sendErrorResponse(res, 200, { message });
                        // }
                        const uuid = req.header('User-Token');
                        const couponDetails = await coupon_service_1.default.checkCouponCode({ query, user, deviceType, uuid });
                        if (couponDetails?.status) {
                            return controller.sendSuccessResponse(res, {
                                requestedData: couponDetails?.requestedData,
                                message: couponDetails.message
                            }, 200);
                        }
                        else {
                            return controller.sendErrorResponse(res, 200, {
                                message: couponDetails?.message,
                            });
                        }
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Validation error',
                            validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                        });
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                        validation: {
                            couponCode: "Coupon code is required"
                        }
                    });
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Country is missing'
                });
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while apply coupon' });
        }
    }
}
exports.default = new CouponController();

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
const country_service_1 = __importDefault(require("../../../services/admin/setup/country-service"));
const mongoose_1 = __importDefault(require("mongoose"));
const excel_upload_1 = require("../../../utils/admin/excel/excel-upload");
const cart_1 = require("../../../constants/cart");
const product_model_1 = __importDefault(require("../../../model/admin/ecommerce/product-model"));
const brands_model_1 = __importDefault(require("../../../model/admin/ecommerce/brands-model"));
const category_model_1 = __importDefault(require("../../../model/admin/ecommerce/category-model"));
const coupon_model_1 = __importDefault(require("../../../model/admin/marketing/coupon-model"));
const product_variants_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-variants-model"));
const controller = new base_controller_1.default();
class CouponsController extends base_controller_1.default {
    async findAll(req, res) {
        try {
            const { page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '', countryId = '' } = req.query;
            let query = { _id: { $exists: true } };
            const { couponFromDate, couponEndDate } = req.query;
            const userData = await res.locals.user;
            const country = (0, helpers_1.getCountryId)(userData);
            if (country) {
                query.countryId = country;
            }
            else if (countryId) {
                query.countryId = new mongoose_1.default.Types.ObjectId(countryId);
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
            const discountStartDate = new Date(couponFromDate);
            const discountEndDate = new Date(couponEndDate);
            if (couponFromDate || couponEndDate) {
                if (couponFromDate) {
                    query = {
                        ...query,
                        'discountDateRange.0': { $lte: discountStartDate },
                        'discountDateRange.1': { $gte: discountEndDate }
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
    async CouponExcelUpload(req, res) {
        const validation = [];
        let excelRowIndex = 2;
        if (req && req.file && req.file?.filename) {
            const couponExcelJsonData = await (0, excel_upload_1.excelUpload)(req, '../../../../public/uploads/coupon/excel/');
            const couponOperations = [];
            if (couponExcelJsonData && couponExcelJsonData.length > 0) {
                let countryData;
                let countryId;
                for (let couponData of couponExcelJsonData) {
                    function excelSerialToDate(serial) {
                        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
                        const days = serial - 1;
                        return new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
                    }
                    function formatDateToISO(date, time = "00:00:00.000") {
                        if (isNaN(date.getTime())) { // Check if the date is invalid
                            throw new Error('Invalid date value');
                        }
                        return date.toISOString().split('T')[0] + 'T' + time + '+00:00';
                    }
                    let startDateFromExcel;
                    let endDateFromExcel;
                    try {
                        startDateFromExcel = excelSerialToDate(couponData.Start_Date);
                        endDateFromExcel = excelSerialToDate(couponData.End_Date);
                    }
                    catch (error) {
                        validation.push(`Invalid date value (row: ${excelRowIndex})`);
                        continue;
                    }
                    const isoStartDateString = formatDateToISO(startDateFromExcel, "20:00:00.000");
                    const isoEndDateString = formatDateToISO(endDateFromExcel, "20:00:00.000");
                    let Coupon_Code = couponData.Coupon_Code ? couponData.Coupon_Code.trim() : 'Unknown Coupon_Code';
                    if (!couponData.Country)
                        validation.push(`Country is required (row: ${excelRowIndex})`);
                    if (!Coupon_Code)
                        validation.push(`Coupon_Code is required (Country: ${couponData.Country})`);
                    if (couponData.Start_Date !== undefined && couponData.End_Date !== undefined) {
                        if (isoStartDateString > isoEndDateString) {
                            validation.push(`End_Date should not be earlier than Start_Date (row: ${excelRowIndex})`);
                        }
                    }
                    if (couponData.Country) {
                        countryData = await country_service_1.default.findCountryId({
                            $or: [{ countryTitle: couponData.Country }, { countryShortTitle: couponData.Country }]
                        });
                        countryId = countryData?._id || null;
                    }
                    let couponAppliedValue = [];
                    const fieldArray = couponData.Coupon_Applied_Fields.split(',');
                    if (couponData.Coupon_Type === cart_1.couponTypes.forProduct) {
                        for (let field of fieldArray) {
                            let productData = await product_model_1.default.findOne({ sku: field }).select('_id') || await product_variants_model_1.default.findOne({ variantSku: field }).select('_id');
                            if (productData) {
                                couponAppliedValue.push(productData._id);
                            }
                            else {
                                validation.push(`Coupon_Type is not available (row: ${excelRowIndex})`);
                            }
                        }
                    }
                    if (couponData.Coupon_Type === cart_1.couponTypes.forBrand) {
                        for (let field of fieldArray) {
                            let brandData = await brands_model_1.default.findOne({ brandTitle: field }).select('_id');
                            if (brandData) {
                                couponAppliedValue.push(brandData._id);
                            }
                            else {
                                validation.push(`Coupon_Type is not available (row: ${excelRowIndex})`);
                            }
                        }
                    }
                    if (couponData.Coupon_Type === cart_1.couponTypes.forCategory) {
                        for (let field of fieldArray) {
                            let categoryData = await category_model_1.default.findOne({ categoryTitle: field }).select('_id');
                            if (categoryData) {
                                couponAppliedValue.push(categoryData._id);
                            }
                            else {
                                validation.push(`Coupon_Type is not available (row: ${excelRowIndex})`);
                            }
                        }
                    }
                    const existingCoupon = await coupon_model_1.default.findOne({ $and: [{ couponCode: couponData.Coupon_Code }, { countryId: countryId }] }).select('_id');
                    if (existingCoupon) {
                        couponOperations.push({
                            updateOne: {
                                filter: { _id: existingCoupon._id },
                                update: {
                                    $set: {
                                        countryId,
                                        couponCode: couponData.Coupon_Code,
                                        couponDescription: couponData.Description,
                                        couponType: couponData.Coupon_Type,
                                        couponApplyValues: couponAppliedValue,
                                        minPurchaseValue: couponData.Minimum_Purchase_value,
                                        discountType: couponData.Discount_Type,
                                        discountAmount: couponData.Discount,
                                        discountMaxRedeemAmount: couponData.Maximum_Redeem_Amount,
                                        couponUsage: {
                                            onlyForNewUser: couponData.New_User,
                                            enableLimitPerUser: couponData.Enable_Limit_Per_User,
                                            limitPerUser: couponData.Limit_Per_User,
                                            enableCouponUsageLimit: couponData.Enable_Usage_Limit,
                                            couponUsageLimit: couponData.Usage_Limit,
                                            displayCoupon: couponData.Display_Coupon,
                                        },
                                        enableFreeShipping: couponData.Free_Shipping,
                                        discountDateRange: [isoStartDateString, isoEndDateString],
                                        status: couponData.Status,
                                        isExcel: true
                                    }
                                }
                            }
                        });
                    }
                    else {
                        couponOperations.push({
                            insertOne: {
                                document: {
                                    countryId,
                                    couponCode: couponData.Coupon_Code,
                                    couponDescription: couponData.Description,
                                    couponType: couponData.Coupon_Type,
                                    couponApplyValues: couponAppliedValue,
                                    minPurchaseValue: couponData.Minimum_Purchase_value,
                                    discountType: couponData.Discount_Type,
                                    discountAmount: couponData.Discount,
                                    discountMaxRedeemAmount: couponData.Maximum_Redeem_Amount,
                                    couponUsage: {
                                        onlyForNewUser: couponData.New_User,
                                        enableLimitPerUser: couponData.Enable_Limit_Per_User,
                                        limitPerUser: couponData.Limit_Per_User,
                                        enableCouponUsageLimit: couponData.Enable_Usage_Limit,
                                        couponUsageLimit: couponData.Usage_Limit,
                                        displayCoupon: couponData.Display_Coupon,
                                    },
                                    enableFreeShipping: couponData.Free_Shipping,
                                    discountDateRange: [isoStartDateString, isoEndDateString],
                                    status: couponData.Status,
                                    isExcel: true
                                }
                            }
                        });
                    }
                }
                if (couponOperations.length > 0) {
                    await coupon_model_1.default.bulkWrite(couponOperations);
                }
                return controller.sendSuccessResponse(res, {
                    validation: validation,
                    message: `Coupon excel upload successfully completed. ${validation.length > 0 ? 'Some Coupon updates were not completed' : ''}`
                }, 200);
            }
            else {
                return controller.sendErrorResponse(res, 200, { message: "Coupon row is empty! Please add at least one row." });
            }
        }
        else {
            return controller.sendErrorResponse(res, 200, { message: "Please upload a file!" });
        }
    }
}
exports.default = new CouponsController();

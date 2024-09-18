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
const mongoose_1 = __importDefault(require("mongoose"));
const excel_upload_1 = require("../../../utils/admin/excel/excel-upload");
const cart_1 = require("../../../constants/cart");
const product_model_1 = __importDefault(require("../../../model/admin/ecommerce/product-model"));
const brands_model_1 = __importDefault(require("../../../model/admin/ecommerce/brands-model"));
const category_model_1 = __importDefault(require("../../../model/admin/ecommerce/category-model"));
const coupon_model_1 = __importDefault(require("../../../model/admin/marketing/coupon-model"));
const product_variants_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-variants-model"));
const country_model_1 = __importDefault(require("../../../model/admin/setup/country-model"));
const general_service_1 = __importDefault(require("../../../services/admin/general-service"));
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
                    activityComment: 'Coupon code created successfull',
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
                            activityComment: 'Coupon code updated successfull',
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
                            activityComment: 'Coupon code status change successfull',
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
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting coupon' });
        }
    }
    async couponExcelUpload(req, res) {
        const validationErrors = [];
        const couponOperations = [];
        let excelRowIndex = 2;
        if (req && req.file && req.file?.filename) {
            const couponExcelJsonData = await (0, excel_upload_1.excelUpload)(req, '../../../../public/uploads/coupon/excel/');
            if (couponExcelJsonData && couponExcelJsonData.length > 0) {
                const userData = res.locals.user;
                const countryData = await country_model_1.default.find();
                const countryMap = {};
                countryData.forEach(country => {
                    if (country.countryTitle) {
                        countryMap[country.countryTitle.toLowerCase()] = country._id;
                    }
                    if (country.countryShortTitle) {
                        countryMap[country.countryShortTitle.toLowerCase()] = country._id;
                    }
                });
                for (let couponData of couponExcelJsonData) {
                    const validationResult = coupon_schema_1.couponExcelUploadSchema.safeParse(couponData);
                    if (!validationResult.success) {
                        validationErrors.push({
                            row: excelRowIndex,
                            errors: (0, helpers_1.formatZodError)(validationResult.error.errors),
                        });
                        continue;
                    }
                    let countryId;
                    let { Country, Start_Date, End_Date, Coupon_Code, Coupon_Applied_Fields, Coupon_Type, Minimum_Purchase_value, Discount_Type, Discount, Maximum_Redeem_Amount, New_User, Enable_Limit_Per_User, Limit_Per_User, Enable_Usage_Limit, Usage_Limit, Display_Coupon, Free_Shipping, Status, Description } = validationResult.data;
                    function formatDateToISO(dateString, time = "00:00:00.000") {
                        const date = new Date(dateString);
                        if (isNaN(date.getTime())) {
                            throw new Error('Invalid date value');
                        }
                        return date.toISOString().split('T')[0] + 'T' + time + '+00:00';
                    }
                    const isoStartDateString = formatDateToISO(Start_Date, "20:00:00.000");
                    const isoEndDateString = formatDateToISO(End_Date, "20:00:00.000");
                    Coupon_Code = Coupon_Code ? Coupon_Code.trim() : 'Unknown Coupon_Code';
                    if (!Country)
                        validationErrors.push(`Country is required (row: ${excelRowIndex})`);
                    if (!Coupon_Code)
                        validationErrors.push(`Coupon_Code is required (Country: ${Country})`);
                    if (Start_Date !== undefined && End_Date !== undefined) {
                        if (isoStartDateString > isoEndDateString) {
                            validationErrors.push(`End_Date should not be earlier than Start_Date (row: ${excelRowIndex})`);
                        }
                    }
                    if (Country) {
                        const countryKey = Country.toLowerCase();
                        countryId = countryMap[countryKey] || null;
                    }
                    let couponAppliedValue = [];
                    const fieldArray = Coupon_Applied_Fields.split(',');
                    if (Coupon_Type === cart_1.couponTypes.forProduct) {
                        for (let field of fieldArray) {
                            let productData = await product_model_1.default.findOne({ sku: field }).select('_id') || await product_variants_model_1.default.findOne({ variantSku: field }).select('_id');
                            if (productData) {
                                couponAppliedValue.push(productData._id);
                            }
                            else {
                                validationErrors.push(`Coupon_Type is not available (row: ${excelRowIndex})`);
                            }
                        }
                    }
                    if (Coupon_Type === cart_1.couponTypes.forBrand) {
                        for (let field of fieldArray) {
                            let brandData = await brands_model_1.default.findOne({ brandTitle: field }).select('_id');
                            if (brandData) {
                                couponAppliedValue.push(brandData._id);
                            }
                            else {
                                validationErrors.push(`Coupon_Type is not available (row: ${excelRowIndex})`);
                            }
                        }
                    }
                    if (Coupon_Type === cart_1.couponTypes.forCategory) {
                        for (let field of fieldArray) {
                            let categoryData = await category_model_1.default.findOne({ categoryTitle: field }).select('_id');
                            if (categoryData) {
                                couponAppliedValue.push(categoryData._id);
                            }
                            else {
                                validationErrors.push(`Coupon_Type is not available (row: ${excelRowIndex})`);
                            }
                        }
                    }
                    const couponInsertData = {
                        countryId,
                        couponCode: Coupon_Code,
                        couponDescription: Description,
                        couponType: Coupon_Type,
                        couponApplyValues: couponAppliedValue,
                        minPurchaseValue: Minimum_Purchase_value,
                        discountType: Discount_Type,
                        discountAmount: Discount,
                        discountMaxRedeemAmount: Maximum_Redeem_Amount,
                        couponUsage: {
                            onlyForNewUser: New_User,
                            enableLimitPerUser: Enable_Limit_Per_User,
                            limitPerUser: Limit_Per_User,
                            enableCouponUsageLimit: Enable_Usage_Limit,
                            couponUsageLimit: Usage_Limit,
                            displayCoupon: Display_Coupon,
                        },
                        enableFreeShipping: Free_Shipping,
                        discountDateRange: [isoStartDateString, isoEndDateString],
                        status: Status,
                        isExcel: true
                    };
                    const existingCoupon = await coupon_model_1.default.findOne({ couponCode: Coupon_Code, countryId }).select('_id');
                    if (existingCoupon) {
                        couponOperations.push({
                            updateOne: {
                                filter: { _id: existingCoupon._id },
                                update: { $set: couponInsertData }
                            }
                        });
                    }
                    else {
                        couponOperations.push({
                            insertOne: {
                                document: { ...couponInsertData, createdBy: userData._id }
                            }
                        });
                    }
                }
                const insertedIds = [];
                const updatedIds = [];
                if (couponOperations.length > 0) {
                    const retVal = await coupon_model_1.default.bulkWrite(couponOperations);
                    insertedIds.push(...Object.values(retVal.insertedIds));
                    const updatePromises = [];
                    for (const operation of couponOperations) {
                        if (operation.updateOne) {
                            const { _id } = operation.updateOne.filter;
                            const couponCode = operation.updateOne.update.$set.couponCode;
                            updatedIds.push(_id);
                            const updateTaskLogs = {
                                userId: userData._id,
                                sourceFromId: _id.toString(),
                                sourceFrom: task_log_1.adminTaskLog.marketing.coupons,
                                activityComment: `Coupon code updated via Excel import: ${couponCode}`,
                                activity: task_log_1.adminTaskLogActivity.update,
                                activityStatus: task_log_1.adminTaskLogStatus.success
                            };
                            updatePromises.push(general_service_1.default.taskLog(updateTaskLogs).then(() => undefined).catch(() => undefined));
                        }
                    }
                    await Promise.all(updatePromises);
                    if (insertedIds.length > 0) {
                        const insertPromises = insertedIds.map(async (id) => {
                            const { couponCode } = await coupon_model_1.default.findById(id).select('couponCode').exec() || { couponCode: 'Unknown' };
                            const insertTaskLogs = {
                                userId: userData._id,
                                sourceFromId: id.toString(),
                                sourceFrom: task_log_1.adminTaskLog.marketing.coupons,
                                activityComment: `Coupon code inserted via Excel import: ${couponCode}`,
                                activity: task_log_1.adminTaskLogActivity.create,
                                activityStatus: task_log_1.adminTaskLogStatus.success
                            };
                            return general_service_1.default.taskLog(insertTaskLogs).then(() => undefined).catch(() => undefined);
                        });
                        await Promise.all(insertPromises);
                    }
                }
                if (validationErrors.length > 0) {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Some coupons failed validation',
                        validation: validationErrors,
                    }, req);
                }
                return controller.sendSuccessResponse(res, {
                    validation: validationErrors,
                    message: `Coupon excel upload successfully completed. ${validationErrors.length > 0 ? 'Some Coupon updates were not completed' : ''}`
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

import 'module-alias/register';
import { Request, Response } from 'express';

import { dateConvertPm, formatZodError, getCountryId } from '../../../utils/helpers';
import { couponExcelUploadSchema, couponSchema, couponStatusSchema } from '../../../utils/schemas/admin/marketing/coupon-schema';
import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from '../../../constants/admin/task-log';
import { QueryParams } from '../../../utils/types/common';

import BaseController from '../../../controllers/admin/base-controller';
import CouponService from '../../../services/admin/marketing/coupon-service'
import CountryService from '../../../services/admin/setup/country-service'
import mongoose, { ObjectId } from 'mongoose';
import { excelUpload } from '../../../utils/admin/excel/excel-upload';
import { couponTypes } from '../../../constants/cart';
import ProductsModel from '../../../model/admin/ecommerce/product-model';
import BrandsModel from '../../../model/admin/ecommerce/brands-model';
import CategoryModel from '../../../model/admin/ecommerce/category-model';
import CouponModel from '../../../model/admin/marketing/coupon-model';
import ProductVariantsModel from '../../../model/admin/ecommerce/product/product-variants-model';
import CountryModel from '../../../model/admin/setup/country-model';
import generalService from '../../../services/admin/general-service';

const controller = new BaseController();

class CouponsController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '', countryId = '' } = req.query as QueryParams;
            let query: any = { _id: { $exists: true } };
            const { couponFromDate, couponEndDate }: any = req.query;

            const userData = await res.locals.user;

            const country = getCountryId(userData);
            if (country) {
                query.countryId = country;
            } else if (countryId) {
                query.countryId = new mongoose.Types.ObjectId(countryId)
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
            const discountStartDate = new Date(couponFromDate);
            const discountEndDate = new Date(couponEndDate);

            if (couponFromDate || couponEndDate) {
                if (couponFromDate) {
                    query = {
                        ...query,
                        'discountDateRange.0': { $lte: discountStartDate },
                        'discountDateRange.1': { $gte: discountEndDate }
                    }
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
                    activityComment: 'Coupon code created successfull',
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
                            activityComment: 'Coupon code updated successfull',
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
                            activityComment: 'Coupon code status change successfull',
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
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting coupon' });
        }
    }

    async couponExcelUpload(req: Request, res: Response): Promise<void> {
        const validationErrors: any[] = [];
        const couponOperations: any[] = [];
        let excelRowIndex = 2;

        if (req && req.file && req.file?.filename) {
            const couponExcelJsonData: any = await excelUpload(req, '../../../../public/uploads/coupon/excel/');
            if (couponExcelJsonData && couponExcelJsonData.length > 0) {
                const userData = res.locals.user;

                const countryData = await CountryModel.find();
                const countryMap: { [key: string]: string } = {};
                countryData.forEach(country => {
                    if (country.countryTitle) {
                        countryMap[country.countryTitle.toLowerCase()] = country._id;
                    }
                    if (country.countryShortTitle) {
                        countryMap[country.countryShortTitle.toLowerCase()] = country._id;
                    }
                });

                for (let couponData of couponExcelJsonData) {
                    const validationResult = couponExcelUploadSchema.safeParse(couponData);
                    if (!validationResult.success) {
                        validationErrors.push({
                            row: excelRowIndex,
                            errors: formatZodError(validationResult.error.errors),
                        });
                        continue;
                    }
                    let countryId;
                    let { Country, Start_Date, End_Date, Coupon_Code, Coupon_Applied_Fields, Coupon_Type, Minimum_Purchase_value, Discount_Type, Discount, Maximum_Redeem_Amount,
                        New_User, Enable_Limit_Per_User, Limit_Per_User, Enable_Usage_Limit, Usage_Limit, Display_Coupon, Free_Shipping, Status, Description } = validationResult.data;

                    function formatDateToISO(dateString: string, time: string = "00:00:00.000"): string {
                        const date = new Date(dateString);
                        if (isNaN(date.getTime())) {
                            throw new Error('Invalid date value');
                        }
                        return date.toISOString().split('T')[0] + 'T' + time + '+00:00';
                    }

                    const isoStartDateString = formatDateToISO(Start_Date, "20:00:00.000");
                    const isoEndDateString = formatDateToISO(End_Date, "20:00:00.000");

                    Coupon_Code = Coupon_Code ? Coupon_Code.trim() : 'Unknown Coupon_Code';

                    if (!Country) {
                        validationErrors.push(`Country is required (row: ${excelRowIndex})`);
                        continue;
                    };
                    if (!Coupon_Code) {
                        validationErrors.push(`Coupon_Code is required (Country: ${Country})`);
                        continue;
                    };

                    if (Start_Date !== undefined && End_Date !== undefined) {
                        if (isoStartDateString > isoEndDateString) {
                            validationErrors.push(`End_Date should not be earlier than Start_Date (row: ${excelRowIndex})`);
                            continue;
                        }
                    }

                    if (Country) {
                        const countryKey = Country.toLowerCase();
                        countryId = countryMap[countryKey] || null;
                    }
                    if (!countryId) {
                        validationErrors.push(`Country not found (row: ${excelRowIndex})`);
                        continue;
                    }
                    let couponAppliedValue: any = [];
                    const fieldArray: any[] = Coupon_Applied_Fields.split(',');

                    if (Coupon_Type === couponTypes.forProduct) {
                        for (let field of fieldArray) {
                            let productData = await ProductsModel.findOne({ sku: field }).select('_id') || await ProductVariantsModel.findOne({ variantSku: field }).select('_id')
                            if (productData) {
                                couponAppliedValue.push(productData._id);
                            } else {
                                validationErrors.push(`Coupon_Type is not available (row: ${excelRowIndex})`);

                            }
                        }
                    } else if (Coupon_Type === couponTypes.forBrand) {
                        for (let field of fieldArray) {
                            let brandData = await BrandsModel.findOne({ brandTitle: field }).select('_id');
                            if (brandData) {
                                couponAppliedValue.push(brandData._id);
                            } else {
                                validationErrors.push(`Coupon_Type is not available (row: ${excelRowIndex})`);
                            }
                        }
                    } else if (Coupon_Type === couponTypes.forCategory) {
                        for (let field of fieldArray) {
                            let categoryData = await CategoryModel.findOne({ categoryTitle: field }).select('_id');
                            if (categoryData) {
                                couponAppliedValue.push(categoryData._id);
                            } else {
                                validationErrors.push(`Coupon_Type value is not found (row: ${excelRowIndex})`);
                            }
                        }
                    }
                    if (couponAppliedValue?.length === 0) {
                        validationErrors.push(`Country not found (row: ${excelRowIndex})`);
                        continue;
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

                    const existingCoupon = await CouponModel.findOne({ couponCode: Coupon_Code, countryId }).select('_id');

                    if (existingCoupon) {
                        couponOperations.push({
                            updateOne: {
                                filter: { _id: existingCoupon._id },
                                update: { $set: couponInsertData }
                            }
                        });
                    } else {
                        couponOperations.push({
                            insertOne: {
                                document: { ...couponInsertData, createdBy: userData._id }
                            }
                        });
                    }
                }

                const insertedIds: ObjectId[] = [];
                const updatedIds: ObjectId[] = [];
                if (couponOperations.length > 0) {
                    const retVal = await CouponModel.bulkWrite(couponOperations);
                    insertedIds.push(...Object.values(retVal.insertedIds));
                    const updatePromises: Promise<void>[] = [];
                    for (const operation of couponOperations) {
                        if (operation.updateOne) {
                            const { _id } = operation.updateOne.filter;
                            const couponCode = operation.updateOne.update.$set.couponCode;
                            updatedIds.push(_id);
                            const updateTaskLogs = {
                                userId: userData._id,
                                sourceFromId: _id.toString(),
                                sourceFrom: adminTaskLog.marketing.coupons,
                                activityComment: `Coupon code updated via Excel import: ${couponCode}`,
                                activity: adminTaskLogActivity.update,
                                activityStatus: adminTaskLogStatus.success
                            };
                            updatePromises.push(
                                generalService.taskLog(updateTaskLogs).then(() => undefined).catch(() => undefined)
                            );
                        }
                    }
                    await Promise.all(updatePromises);
                    if (insertedIds.length > 0) {
                        const insertPromises = insertedIds.map(async (id) => {
                            const { couponCode } = await CouponModel.findById(id).select('couponCode').exec() || { couponCode: 'Unknown' };
                            const insertTaskLogs = {
                                userId: userData._id,
                                sourceFromId: id.toString(),
                                sourceFrom: adminTaskLog.marketing.coupons,
                                activityComment: `Coupon code inserted via Excel import: ${couponCode}`,
                                activity: adminTaskLogActivity.create,
                                activityStatus: adminTaskLogStatus.success
                            };
                            return generalService.taskLog(insertTaskLogs).then(() => undefined).catch(() => undefined);
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

            } else {
                return controller.sendErrorResponse(res, 200, { message: "Coupon row is empty! Please add at least one row." });
            }
        } else {
            return controller.sendErrorResponse(res, 200, { message: "Please upload a file!" });
        }
    }

}

export default new CouponsController();
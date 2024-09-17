import 'module-alias/register';
import { Request, Response } from 'express';

import { dateConvertPm, formatZodError, getCountryId } from '../../../utils/helpers';
import { couponSchema, couponStatusSchema } from '../../../utils/schemas/admin/marketing/coupon-schema';
import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from '../../../constants/admin/task-log';
import { QueryParams } from '../../../utils/types/common';

import BaseController from '../../../controllers/admin/base-controller';
import CouponService from '../../../services/admin/marketing/coupon-service'
import CountryService from '../../../services/admin/setup/country-service'
import mongoose from 'mongoose';
import { excelUpload } from '../../../utils/admin/excel/excel-upload';
import { couponTypes } from '../../../constants/cart';
import ProductsModel from '../../../model/admin/ecommerce/product-model';
import BrandsModel from '../../../model/admin/ecommerce/brands-model';
import CategoryModel from '../../../model/admin/ecommerce/category-model';
import CouponModel from '../../../model/admin/marketing/coupon-model';
import ProductVariantsModel from '../../../model/admin/ecommerce/product/product-variants-model';

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

    async CouponExcelUpload(req: Request, res: Response): Promise<void> {
        const validation: any = [];
        let excelRowIndex = 2;

        if (req && req.file && req.file?.filename) {
            const couponExcelJsonData: any = await excelUpload(req, '../../../../public/uploads/coupon/excel/');
            const couponOperations: any = [];

            if (couponExcelJsonData && couponExcelJsonData.length > 0) {
                let countryData: any;
                let countryId;

                for (let couponData of couponExcelJsonData) {

                    function excelSerialToDate(serial: number): Date {
                        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
                        const days = serial - 1;
                        return new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
                    }

                    function formatDateToISO(date: Date, time: string = "00:00:00.000"): string {
                        if (isNaN(date.getTime())) { // Check if the date is invalid
                            throw new Error('Invalid date value');
                        }
                        return date.toISOString().split('T')[0] + 'T' + time + '+00:00';
                    }

                    let startDateFromExcel: Date;
                    let endDateFromExcel: Date;

                    try {
                        startDateFromExcel = excelSerialToDate(couponData.Start_Date);
                        endDateFromExcel = excelSerialToDate(couponData.End_Date);
                    } catch (error) {
                        validation.push(`Invalid date value (row: ${excelRowIndex})`);
                        continue;
                    }

                    const isoStartDateString = formatDateToISO(startDateFromExcel, "20:00:00.000");
                    const isoEndDateString = formatDateToISO(endDateFromExcel, "20:00:00.000");

                    let Coupon_Code = couponData.Coupon_Code ? couponData.Coupon_Code.trim() : 'Unknown Coupon_Code';

                    if (!couponData.Country) validation.push(`Country is required (row: ${excelRowIndex})`);
                    if (!Coupon_Code) validation.push(`Coupon_Code is required (Country: ${couponData.Country})`);

                    if (couponData.Start_Date !== undefined && couponData.End_Date !== undefined) {
                        if (isoStartDateString > isoEndDateString) {
                            validation.push(`End_Date should not be earlier than Start_Date (row: ${excelRowIndex})`);
                        }
                    }

                    if (couponData.Country) {
                        countryData = await CountryService.findCountryId({
                            $or: [{ countryTitle: couponData.Country }, { countryShortTitle: couponData.Country }]
                        });
                        countryId = countryData?._id || null;
                    }

                    let couponAppliedValue: any = [];
                    const fieldArray: any[] = couponData.Coupon_Applied_Fields.split(',');

                    if (couponData.Coupon_Type === couponTypes.forProduct) {
                        for (let field of fieldArray) {
                            let productData = await ProductsModel.findOne({ sku: field }).select('_id') || await ProductVariantsModel.findOne({ variantSku: field }).select('_id')
                            if (productData) {
                                couponAppliedValue.push(productData._id);
                            } else {
                                validation.push(`Coupon_Type is not available (row: ${excelRowIndex})`);
                            }
                        }
                    }

                    if (couponData.Coupon_Type === couponTypes.forBrand) {
                        for (let field of fieldArray) {
                            let brandData = await BrandsModel.findOne({ brandTitle: field }).select('_id');
                            if (brandData) {
                                couponAppliedValue.push(brandData._id);
                            } else {
                                validation.push(`Coupon_Type is not available (row: ${excelRowIndex})`);
                            }
                        }
                    }

                    if (couponData.Coupon_Type === couponTypes.forCategory) {
                        for (let field of fieldArray) {
                            let categoryData = await CategoryModel.findOne({ categoryTitle: field }).select('_id');
                            if (categoryData) {
                                couponAppliedValue.push(categoryData._id);
                            } else {
                                validation.push(`Coupon_Type is not available (row: ${excelRowIndex})`);
                            }
                        }
                    }

                    const existingCoupon = await CouponModel.findOne({ $and: [{ couponCode: couponData.Coupon_Code }, { countryId: countryId }] }).select('_id');

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
                    } else {
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
                    await CouponModel.bulkWrite(couponOperations);
                }

                return controller.sendSuccessResponse(res, {
                    validation: validation,
                    message: `Coupon excel upload successfully completed. ${validation.length > 0 ? 'Some Coupon updates were not completed' : ''}`
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
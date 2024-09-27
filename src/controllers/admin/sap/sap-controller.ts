import { Request, Response } from "express";
import mongoose from "mongoose";

import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from "../../../constants/admin/task-log";

import { findOrderStatusDateCheck } from "../../../utils/admin/order";
import { cartStatus as cartStatusJson, orderStatusMap } from "../../../constants/cart";
import { dateConvertPm } from "../../../utils/helpers";
import { OrderQueryParams } from "../../../utils/types/order";

import BaseController from "../base-controller";
import countryService from "../../../services/admin/setup/country-service";
import ProductVariantsModel from "../../../model/admin/ecommerce/product/product-variants-model";
import GeneralService from "../../../services/admin/general-service";
import SapOrderService from "../../../services/sap/sap-order-service";
import { collections } from "../../../constants/collections";


const controller = new BaseController();
class SapController extends BaseController {

    async getOrderDetails(req: Request, res: Response): Promise<any> {
        try {
            const { country = '', orderId = '', paymentMethod = '', customer = '', fromDate, endDate, orderStatus = '', getaddress = '1', getcustomer = '0', getpaymentmethod = '0', page_size = 1, limit = 10, sortby = '', sortorder = '', } = req.query as OrderQueryParams;
            let query: any = { _id: { $exists: true } };

            query = { cartStatus: { $ne: cartStatusJson.active } }
            if (country) {
                query = {
                    $and: [
                        { 'country.countryShortTitle': country },
                        // { 'country.countryTitle': country },
                    ],
                    ...query
                } as any;
            }
            if (paymentMethod) {
                query = {
                    $or: [
                        { 'paymentMethod.paymentMethodTitle': paymentMethod },
                        { 'paymentMethod.slug': paymentMethod },
                    ],
                    ...query
                } as any;
            }
            if (customer) {
                query = {
                    $or: [
                        { 'customer.firstName': customer },
                        { 'customer.phone': customer },
                        { 'customer.guestPhone': customer },
                        { 'customer.guestEmail': customer },
                        { 'customer.email': customer },
                    ],
                    ...query
                } as any;
            }
            if (orderId) {
                const isObjectId = /^[0-9a-fA-F]{24}$/.test(orderId);
                if (isObjectId) {
                    query = {
                        ...query, _id: new mongoose.Types.ObjectId(orderId)
                    } as any;
                } else {
                    query = {
                        ...query, orderId
                    } as any;
                }
            }

            if (orderStatus) {
                query = {
                    ...query, orderStatus: orderStatus
                } as any;
            }

            if (fromDate || endDate) {
                const dateFilter: { $gte?: Date; $lte?: Date } = {};

                if (fromDate) dateFilter.$gte = new Date(fromDate);
                if (endDate) dateFilter.$lte = dateConvertPm(endDate);

                if (orderStatus) {
                    const statusField = findOrderStatusDateCheck(orderStatusMap[orderStatus].value);
                    query[statusField] = { ...dateFilter };
                } else {
                    query['orderStatusAt'] = { ...dateFilter };
                }
            }

            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const orders: any = await SapOrderService.SapOrderList({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort,
                getCartProducts: '1',
                getcustomer,
                getpaymentmethod,
                getaddress,
                hostName: req.get('origin'),
            });


            const totalCount = await SapOrderService.SapOrderList({
                page: parseInt(page_size as string),
                query,
                getTotalCount: true
            })
            return controller.sendSuccessResponse(res, {
                requestedData: orders,
                totalCount: totalCount.length,
                message: 'Success!'
            }, 200);



        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching coupons' });
        }
    }

    async productPriceUpdate(req: Request, res: Response): Promise<void> {
        const productVariantPriceQuantityUpdationErrorMessage: any = []
        var productRowIndex = 2
        let isProductVariantUpdate = false
        const { productData } = req.body;
        if (productData && productData?.length > 0) {
            let countryDataCache: any = {};
            for (let productPriceData of productData) {
                let fieldsErrors = [];
                let variantSku = productPriceData.variantSku ? productPriceData.variantSku.trim() : 'Unknown SKU';

                if (!productPriceData.country) fieldsErrors.push(`Country is required (VariantSku: ${variantSku})`);
                if (!variantSku) fieldsErrors.push(`VariantSku is required (Country: ${productPriceData.country})`);

                if (productPriceData.productPrice !== undefined && productPriceData.discountPrice !== undefined) {
                    if (Number(productPriceData.productPrice) <= Number(productPriceData.discountPrice)) {
                        fieldsErrors.push(`ProductPrice should be greater than DiscountPrice (VariantSku: ${variantSku})`);
                    }
                }

                if (productPriceData.quantity !== undefined && Number(productPriceData.quantity) < 0) {
                    fieldsErrors.push(`Quantity should be greater than or equal to 0 (VariantSku: ${variantSku})`);
                }

                if (productPriceData.productPrice === undefined && productPriceData.discountPrice === undefined && productPriceData.quantity === undefined) {
                    fieldsErrors.push(`At least one field (ProductPrice, DiscountPrice, or Quantity) must be provided for update (VariantSku: ${variantSku})`);
                }

                let countryData = countryDataCache[productPriceData.country];
                if (!countryData) {
                    countryData = await countryService.findCountryId({
                        $or: [{ countryTitle: productPriceData.country }, { countryShortTitle: productPriceData.country }]
                    });
                    if (!countryData) {
                        fieldsErrors.push(`Country not found for '${productPriceData.country}' (VariantSku: ${variantSku})`);
                    } else {
                        countryDataCache[productPriceData.country] = countryData;
                    }
                }

                let productVariantDetails: any = null;
                if (variantSku) {
                    productVariantDetails = await ProductVariantsModel.findOne({ countryId: countryData._id, variantSku: variantSku });
                    if (!productVariantDetails) {
                        fieldsErrors.push(`Product variant not found for VariantSku: '${variantSku}' in the specified country.`);
                    }
                }
                if (productPriceData.discountPrice !== undefined && productVariantDetails) {
                    if (Number(productPriceData.discountPrice) >= 0 && Number(productPriceData.discountPrice) >= Number(productVariantDetails.price)) {
                        fieldsErrors.push(`DiscountPrice should be less than existing ProductPrice (VariantSku: ${variantSku})`);
                    }
                }

                if (fieldsErrors.length > 0) {
                    isProductVariantUpdate = false;
                    productVariantPriceQuantityUpdationErrorMessage.push({
                        row: `Row: ${productRowIndex}`,
                        message: `Errors: ${fieldsErrors.join(', ')}`
                    });
                } else {
                    const updateVariantData: any = {};
                    let updateComment: string[] = [];

                    if (productPriceData.productPrice !== undefined && Number(productPriceData.productPrice) >= 0) {
                        if (productVariantDetails && productVariantDetails.discountPrice !== undefined && Number(productPriceData.productPrice) <= Number(productVariantDetails.discountPrice)) {
                            fieldsErrors.push(`ProductPrice should be greater than the existing DiscountPrice (VariantSku: ${variantSku})`);
                        } else {
                            updateVariantData.price = Number(productPriceData.productPrice);
                            updateComment.push(`Price updated to ${updateVariantData.price}`);
                        }
                    } else if (productPriceData.productPrice !== undefined && Number(productPriceData.productPrice) < 0) {
                        fieldsErrors.push(`ProductPrice should be greater than or equal to 0 (VariantSku: ${variantSku})`);
                    }

                    if (productPriceData.discountPrice !== undefined && Number(productPriceData.discountPrice) >= 0) {
                        updateVariantData.discountPrice = Number(productPriceData.discountPrice);
                        updateComment.push(`Discount Price updated to ${updateVariantData.discountPrice}`);
                    } else if (productPriceData.discountPrice !== undefined && Number(productPriceData.discountPrice) < 0) {
                        fieldsErrors.push(`DiscountPrice should be greater than or equal to 0 (VariantSku: ${variantSku})`);
                    }

                    if (productPriceData.quantity !== undefined && Number(productPriceData.quantity) >= 0) {
                        updateVariantData.quantity = Number(productPriceData.quantity);
                        updateComment.push(`Quantity updated to ${updateVariantData.quantity}`);
                    } else if (productPriceData.quantity !== undefined && Number(productPriceData.quantity) < 0) {
                        fieldsErrors.push(`Quantity should be greater than or equal to 0 (VariantSku: ${variantSku})`);
                    }

                    if (fieldsErrors.length > 0) {
                        isProductVariantUpdate = false;
                        productVariantPriceQuantityUpdationErrorMessage.push({
                            row: `Row: ${productRowIndex}`,
                            message: `Errors: ${fieldsErrors.join(', ')}`
                        });
                    } else {
                        await ProductVariantsModel.findOneAndUpdate(
                            { countryId: countryData._id, variantSku: variantSku },
                            { $set: updateVariantData },
                            { new: true }
                        );

                        const userData = res.locals.user;
                        const updateTaskLogs = {
                            userId: userData._id,
                            countryId: userData.countryId,
                            sourceCollection: collections.ecommerce.products.productvariants.productvariants,
                            referenceData: JSON.stringify(productPriceData, null, 2),
                            sourceFromId: productVariantDetails.productId,
                            sourceFromReferenceId: productVariantDetails._id,
                            sourceFrom: adminTaskLog.ecommerce.products,
                            activityComment: `Updated via Sap updation: ${updateComment.join('; ')}`,
                            activity: adminTaskLogActivity.update,
                            activityStatus: adminTaskLogStatus.success
                        };

                        await GeneralService.taskLog({ ...updateTaskLogs, userId: userData._id });
                        isProductVariantUpdate = true;
                    }
                }
                productRowIndex++;
            }

            if (!isProductVariantUpdate) {
                return controller.sendErrorResponse(res, 200, {
                    message: "Validation failed for the following rows",
                    validation: productVariantPriceQuantityUpdationErrorMessage
                });
            } else {
                return controller.sendSuccessResponse(res, {
                    validation: productVariantPriceQuantityUpdationErrorMessage,
                    message: `Product updation successfully completed. ${productVariantPriceQuantityUpdationErrorMessage.length > 0 ? 'Some Product updation are not completed' : ''}`
                }, 200);
            }
        } else {
            return controller.sendErrorResponse(res, 200, { message: "Product row is empty! Please add atleast one row." });
        }
    }

}

export default new SapController();
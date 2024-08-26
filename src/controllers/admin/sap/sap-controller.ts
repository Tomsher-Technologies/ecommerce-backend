import { Request, Response } from "express";

import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from "../../../constants/admin/task-log";

import BaseController from "../base-controller";
import countryService from "../../../services/admin/setup/country-service";
import ProductVariantsModel from "../../../model/admin/ecommerce/product/product-variants-model";
import GeneralService from "../../../services/admin/general-service";


const controller = new BaseController();
class SapController extends BaseController {

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
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const task_log_1 = require("../../../constants/admin/task-log");
const order_1 = require("../../../utils/admin/order");
const cart_1 = require("../../../constants/cart");
const helpers_1 = require("../../../utils/helpers");
const base_controller_1 = __importDefault(require("../base-controller"));
const country_service_1 = __importDefault(require("../../../services/admin/setup/country-service"));
const product_variants_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-variants-model"));
const general_service_1 = __importDefault(require("../../../services/admin/general-service"));
const sap_order_service_1 = __importDefault(require("../../../services/sap/sap-order-service"));
const collections_1 = require("../../../constants/collections");
const controller = new base_controller_1.default();
class SapController extends base_controller_1.default {
    async getOrderDetails(req, res) {
        try {
            const { country = '', orderId = '', paymentMethod = '', customer = '', fromDate, endDate, orderStatus = '', getaddress = '1', getcustomer = '0', getpaymentmethod = '0', page_size = 1, limit = 10, sortby = '', sortorder = '', } = req.query;
            let query = { _id: { $exists: true } };
            query = { cartStatus: { $ne: cart_1.cartStatus.active } };
            if (country) {
                query = {
                    $and: [
                        { 'country.countryShortTitle': country },
                        // { 'country.countryTitle': country },
                    ],
                    ...query
                };
            }
            if (paymentMethod) {
                query = {
                    $or: [
                        { 'paymentMethod.paymentMethodTitle': paymentMethod },
                        { 'paymentMethod.slug': paymentMethod },
                    ],
                    ...query
                };
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
                };
            }
            if (orderId) {
                const isObjectId = /^[0-9a-fA-F]{24}$/.test(orderId);
                if (isObjectId) {
                    query = {
                        ...query, _id: new mongoose_1.default.Types.ObjectId(orderId)
                    };
                }
                else {
                    query = {
                        ...query, orderId
                    };
                }
            }
            if (orderStatus) {
                query = {
                    ...query, orderStatus: orderStatus
                };
            }
            if (fromDate || endDate) {
                const dateFilter = {};
                if (fromDate)
                    dateFilter.$gte = new Date(fromDate);
                if (endDate)
                    dateFilter.$lte = (0, helpers_1.dateConvertPm)(endDate);
                if (orderStatus) {
                    const statusField = (0, order_1.findOrderStatusDateCheck)(cart_1.orderStatusMap[orderStatus].value);
                    query[statusField] = { ...dateFilter };
                }
                else {
                    query['orderStatusAt'] = { ...dateFilter };
                }
            }
            const sort = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const orders = await sap_order_service_1.default.SapOrderList({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort,
                getCartProducts: '1',
                getcustomer,
                getpaymentmethod,
                getaddress,
                hostName: req.get('origin'),
            });
            const totalCount = await sap_order_service_1.default.SapOrderList({
                page: parseInt(page_size),
                query,
                getTotalCount: true
            });
            return controller.sendSuccessResponse(res, {
                requestedData: orders,
                totalCount: totalCount.length,
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching coupons' });
        }
    }
    async productPriceUpdate(req, res) {
        const productVariantPriceQuantityUpdationErrorMessage = [];
        var productRowIndex = 2;
        let isProductVariantUpdate = false;
        const { productData } = req.body;
        if (productData && productData?.length > 0) {
            let countryDataCache = {};
            for (let productPriceData of productData) {
                let fieldsErrors = [];
                let variantSku = productPriceData.variantSku ? productPriceData.variantSku.trim() : 'Unknown SKU';
                if (!productPriceData.country)
                    fieldsErrors.push(`Country is required (VariantSku: ${variantSku})`);
                if (!variantSku)
                    fieldsErrors.push(`VariantSku is required (Country: ${productPriceData.country})`);
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
                    countryData = await country_service_1.default.findCountryId({
                        $or: [{ countryTitle: productPriceData.country }, { countryShortTitle: productPriceData.country }]
                    });
                    if (!countryData) {
                        fieldsErrors.push(`Country not found for '${productPriceData.country}' (VariantSku: ${variantSku})`);
                    }
                    else {
                        countryDataCache[productPriceData.country] = countryData;
                    }
                }
                let productVariantDetails = null;
                if (variantSku) {
                    productVariantDetails = await product_variants_model_1.default.findOne({ countryId: countryData._id, variantSku: variantSku });
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
                }
                else {
                    const updateVariantData = {};
                    let updateComment = [];
                    if (productPriceData.productPrice !== undefined && Number(productPriceData.productPrice) >= 0) {
                        if (productVariantDetails && productVariantDetails.discountPrice !== undefined && Number(productPriceData.productPrice) <= Number(productVariantDetails.discountPrice)) {
                            fieldsErrors.push(`ProductPrice should be greater than the existing DiscountPrice (VariantSku: ${variantSku})`);
                        }
                        else {
                            updateVariantData.price = Number(productPriceData.productPrice);
                            updateComment.push(`Price updated to ${updateVariantData.price}`);
                        }
                    }
                    else if (productPriceData.productPrice !== undefined && Number(productPriceData.productPrice) < 0) {
                        fieldsErrors.push(`ProductPrice should be greater than or equal to 0 (VariantSku: ${variantSku})`);
                    }
                    if (productPriceData.discountPrice !== undefined && Number(productPriceData.discountPrice) >= 0) {
                        updateVariantData.discountPrice = Number(productPriceData.discountPrice);
                        updateComment.push(`Discount Price updated to ${updateVariantData.discountPrice}`);
                    }
                    else if (productPriceData.discountPrice !== undefined && Number(productPriceData.discountPrice) < 0) {
                        fieldsErrors.push(`DiscountPrice should be greater than or equal to 0 (VariantSku: ${variantSku})`);
                    }
                    if (productPriceData.quantity !== undefined && Number(productPriceData.quantity) >= 0) {
                        updateVariantData.quantity = Number(productPriceData.quantity);
                        updateComment.push(`Quantity updated to ${updateVariantData.quantity}`);
                    }
                    else if (productPriceData.quantity !== undefined && Number(productPriceData.quantity) < 0) {
                        fieldsErrors.push(`Quantity should be greater than or equal to 0 (VariantSku: ${variantSku})`);
                    }
                    if (fieldsErrors.length > 0) {
                        isProductVariantUpdate = false;
                        productVariantPriceQuantityUpdationErrorMessage.push({
                            row: `Row: ${productRowIndex}`,
                            message: `Errors: ${fieldsErrors.join(', ')}`
                        });
                    }
                    else {
                        await product_variants_model_1.default.findOneAndUpdate({ countryId: countryData._id, variantSku: variantSku }, { $set: updateVariantData }, { new: true });
                        const userData = res.locals.user;
                        const updateTaskLogs = {
                            userId: userData._id,
                            countryId: userData.countryId,
                            sourceCollection: collections_1.collections.ecommerce.products.productvariants.productvariants,
                            referenceData: JSON.stringify(productPriceData, null, 2),
                            sourceFromId: productVariantDetails.productId,
                            sourceFromReferenceId: productVariantDetails._id,
                            sourceFrom: task_log_1.adminTaskLog.ecommerce.products,
                            activityComment: `Updated via Sap updation: ${updateComment.join('; ')}`,
                            activity: task_log_1.adminTaskLogActivity.update,
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        };
                        await general_service_1.default.taskLog({ ...updateTaskLogs, userId: userData._id });
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
            }
            else {
                return controller.sendSuccessResponse(res, {
                    validation: productVariantPriceQuantityUpdationErrorMessage,
                    message: `Product updation successfully completed. ${productVariantPriceQuantityUpdationErrorMessage.length > 0 ? 'Some Product updation are not completed' : ''}`
                }, 200);
            }
        }
        else {
            return controller.sendErrorResponse(res, 200, { message: "Product row is empty! Please add atleast one row." });
        }
    }
}
exports.default = new SapController();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const cart_order_model_1 = __importDefault(require("../../../model/frontend/cart-order-model"));
const cart_order_config_1 = require("../../../utils/config/cart-order-config");
const product_config_1 = require("../../../utils/config/product-config");
const wishlist_config_1 = require("../../../utils/config/wishlist-config");
class OrderService {
    constructor() {
    }
    async OrderList(options) {
        const { query, skip, limit, sort, hostName } = (0, pagination_1.frontendPagination)(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        const pipeline = [
            cart_order_config_1.cartLookup,
            { $match: query },
            { $sort: finalSort },
            cart_order_config_1.cartProject
        ];
        if (skip) {
            pipeline.push({ $skip: skip });
        }
        if (limit) {
            pipeline.push({ $limit: limit });
        }
        const createdCartWithValues = await cart_order_model_1.default.aggregate(pipeline);
        return createdCartWithValues;
    }
    async orderDetails(options) {
        const { query, skip, limit, sort, hostName } = (0, pagination_1.frontendPagination)(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        // productVariantAttributesLookup
        const modifiedPipeline = {
            $lookup: {
                ...cart_order_config_1.cartLookup.$lookup,
                pipeline: [
                    product_config_1.productLookup,
                    // productBrandLookupValues,
                    // { $unwind: { path: "$productDetails.brand", preserveNullAndEmptyArrays: true } },
                    // brandObject,
                    { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
                    (0, wishlist_config_1.productVariantsLookupValues)("1"),
                    // attributePipeline,
                    { $unwind: { path: "$productDetails.variantDetails", preserveNullAndEmptyArrays: true } },
                    wishlist_config_1.wishlistProductCategoryLookup,
                ]
            }
        };
        const pipeline = [
            modifiedPipeline,
            cart_order_config_1.couponLookup,
            cart_order_config_1.couponObject,
            cart_order_config_1.shippingLookup,
            cart_order_config_1.shippingObject,
            cart_order_config_1.billingLookup,
            cart_order_config_1.billingObject,
            cart_order_config_1.paymentMethodLookup,
            cart_order_config_1.paymentMethodObject,
            cart_order_config_1.pickupStoreLookup,
            cart_order_config_1.pickupStoreObject,
            { $match: query },
            { $sort: finalSort },
        ];
        if (skip) {
            pipeline.push({ $skip: skip });
        }
        if (limit) {
            pipeline.push({ $limit: limit });
        }
        const createdCartWithValues = await cart_order_model_1.default.aggregate(pipeline);
        // console.log("createdCartWithValues", createdCartWithValues);
        return createdCartWithValues[0];
        // return CartOrderModel.findOne(data);
    }
}
exports.default = new OrderService();

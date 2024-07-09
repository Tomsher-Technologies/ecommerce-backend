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
        const { query, skip, limit, sort } = (0, pagination_1.frontendPagination)(options.query || {}, options);
        const { getAddress, getCartProducts } = options;
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        const modifiedPipeline = {
            $lookup: {
                ...cart_order_config_1.cartLookup.$lookup,
                pipeline: [
                    product_config_1.productLookup,
                    // productBrandLookupValues,
                    // { $unwind: { path: "$productDetails.brand", preserveNullAndEmptyArrays: true } },
                    { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
                    (0, wishlist_config_1.productVariantsLookupValues)("1"),
                    // attributePipeline,
                    { $unwind: { path: "$productDetails.variantDetails", preserveNullAndEmptyArrays: true } },
                ]
            }
        };
        const pipeline = [
            ...(getCartProducts === '1' ? [modifiedPipeline] : [cart_order_config_1.cartLookup]),
            ...(getCartProducts ? [cart_order_config_1.couponLookup, { $unwind: { path: "$couponDetails", preserveNullAndEmptyArrays: true } }] : []),
            cart_order_config_1.paymentMethodLookup,
            cart_order_config_1.customerLookup,
            cart_order_config_1.orderListObjectLookup,
            ...(getAddress === '1' ? (0, cart_order_config_1.shippingAndBillingLookup)('shippingId', 'shippingAddress') : []),
            ...(getAddress === '1' ? (0, cart_order_config_1.shippingAndBillingLookup)('billingId', 'billingAddress') : []),
            { $match: query },
            { $sort: finalSort },
            ...(getCartProducts === '1' ? [cart_order_config_1.cartDeatilProject] : [cart_order_config_1.cartProject]),
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
    async orderStatusUpdate(orderId, orderData) {
        const updatedBrand = await cart_order_model_1.default.findByIdAndUpdate(orderId, orderData, { new: true, useFindAndModify: false });
        if (updatedBrand) {
            const pipeline = [
                { $match: { _id: updatedBrand._id } },
                cart_order_config_1.cartLookup,
                cart_order_config_1.paymentMethodLookup,
                cart_order_config_1.customerLookup,
                cart_order_config_1.orderListObjectLookup,
                cart_order_config_1.cartProject
            ];
            const updatedBrandWithValues = await cart_order_model_1.default.aggregate(pipeline);
            return updatedBrandWithValues[0];
        }
        else {
            return null;
        }
    }
}
exports.default = new OrderService();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../components/pagination");
const cart_order_model_1 = __importDefault(require("../../model/frontend/cart-order-model"));
const cart_order_config_1 = require("../../utils/config/cart-order-config");
const customer_config_1 = require("../../utils/config/customer-config");
const product_config_1 = require("../../utils/config/product-config");
const wishlist_config_1 = require("../../utils/config/wishlist-config");
class SapOrderService {
    async SapOrderList(options) {
        const { query, skip, limit, sort, getTotalCount } = (0, pagination_1.pagination)(options.query || {}, options);
        const { getaddress, getCartProducts, getpaymentmethod, getcustomer } = options;
        const defaultSort = { orderId: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        const modifiedPipeline = {
            $lookup: {
                ...cart_order_config_1.cartProductsLookup.$lookup,
                pipeline: [
                    product_config_1.productLookup,
                    { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
                    (0, wishlist_config_1.productVariantsLookupValues)("1"),
                    { $unwind: { path: "$productDetails.variantDetails", preserveNullAndEmptyArrays: true } },
                ]
            }
        };
        const pipeline = [
            ...((!getTotalCount && getCartProducts === '1') ? [modifiedPipeline] : [cart_order_config_1.cartProductsLookup]),
            ...((!getTotalCount && getcustomer === '1') ? [cart_order_config_1.customerLookup] : []),
            ...((!getTotalCount && getpaymentmethod === '1') ? [cart_order_config_1.paymentMethodLookup] : []),
            ...((!getTotalCount && (getcustomer === '1' || getpaymentmethod === '1')) ? [cart_order_config_1.orderListObjectLookup] : []),
            ...((!getTotalCount && getaddress === '1') ? (0, cart_order_config_1.shippingAndBillingLookup)('shippingId', 'shippingAddress') : []),
            customer_config_1.countriesLookup,
            {
                $unwind: {
                    path: "$country",
                    preserveNullAndEmptyArrays: true
                }
            },
            { $match: query },
            ...((!getTotalCount && getCartProducts === '1') ? [cart_order_config_1.cartDeatilSimpleProject] : [cart_order_config_1.cartProject]),
        ];
        if (!getTotalCount) {
            pipeline.push({ $sort: finalSort });
        }
        if (!getTotalCount && skip) {
            pipeline.push({ $skip: skip });
        }
        if (!getTotalCount && limit) {
            pipeline.push({ $limit: limit });
        }
        const createdCartWithValues = await cart_order_model_1.default.aggregate(pipeline);
        return createdCartWithValues;
    }
}
exports.default = new SapOrderService();

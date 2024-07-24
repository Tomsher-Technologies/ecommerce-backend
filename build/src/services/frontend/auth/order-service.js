"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const wishlist_config_1 = require("../../../utils/config/wishlist-config");
const product_config_1 = require("../../../utils/config/product-config");
const sub_domain_1 = require("../../../utils/frontend/sub-domain");
const cart_order_config_1 = require("../../../utils/config/cart-order-config");
const cart_order_model_1 = __importDefault(require("../../../model/frontend/cart-order-model"));
const language_model_1 = __importDefault(require("../../../model/admin/setup/language-model"));
class OederService {
    async orderList(options) {
        const { query, skip, limit, sort, hostName } = (0, pagination_1.frontendPagination)(options.query || {}, options);
        const { getAddress, getCartProducts } = options;
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        const languageData = await language_model_1.default.find().exec();
        const languageId = await (0, sub_domain_1.getLanguageValueFromSubdomain)(hostName, languageData);
        const modifiedPipeline = {
            $lookup: {
                ...cart_order_config_1.cartLookup.$lookup,
                pipeline: [
                    product_config_1.productLookup,
                    { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
                    (0, wishlist_config_1.productVariantsLookupValues)("1"),
                    // attributePipeline,
                    { $unwind: { path: "$productDetails.variantDetails", preserveNullAndEmptyArrays: true } },
                    wishlist_config_1.wishlistProductCategoryLookup,
                    (0, wishlist_config_1.multilanguageFieldsLookup)(languageId),
                    { $unwind: { path: "$productDetails.languageValues", preserveNullAndEmptyArrays: true } },
                    wishlist_config_1.replaceProductLookupValues,
                    { $unset: "productDetails.languageValues" },
                ]
            }
        };
        const pipeline = [
            ...(getCartProducts === '1' ? [modifiedPipeline] : [cart_order_config_1.cartLookup]),
            ...(getAddress === '1' ? (0, cart_order_config_1.shippingAndBillingLookup)('shippingId', 'shippingAddress') : []),
            ...(getAddress === '1' ? (0, cart_order_config_1.shippingAndBillingLookup)('billingId', 'billingAddress') : []),
            cart_order_config_1.paymentMethodLookup,
            cart_order_config_1.orderListObjectLookup,
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
        // console.log("createdCartWithValues", createdCartWithValues);
        return createdCartWithValues;
        // return CartOrderModel.findOne(data);
    }
}
exports.default = new OederService();

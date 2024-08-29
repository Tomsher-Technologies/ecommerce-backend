"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../../components/pagination");
const cart_order_model_1 = __importDefault(require("../../../../model/frontend/cart-order-model"));
class ProductReportService {
    async topSelling(options) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        const defaultSort = { totalQuantity: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0 || !sortKeys[0]) {
            finalSort = defaultSort;
        }
        const pipeline = [
            {
                $lookup: {
                    from: 'cartorderproducts',
                    localField: '_id',
                    foreignField: 'cartId',
                    as: 'products'
                }
            },
            {
                $unwind: {
                    path: "$products",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: query
            },
            {
                $group: {
                    _id: "$products.variantId",
                    totalQuantity: { $sum: "$products.quantity" }
                }
            },
            {
                $lookup: {
                    from: 'productvariants',
                    localField: "_id",
                    foreignField: "variantId",
                    as: "productDetails"
                }
            },
            { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    variantId: "$_id",
                    totalQuantity: 1,
                    productName: "$productDetails.extraProductTitle",
                    productPrice: "$productDetails.price",
                    discountPrice: "$productDetails.discountPrice",
                    variantSku: "$productDetails.variantSku",
                    variantDescription: "$productDetails.variantDescription",
                }
            },
            { $sort: finalSort },
            ...(skip ? [{ $skip: skip }] : []),
            ...(limit ? [{ $limit: limit }] : []),
        ];
        const topSellingProducts = await cart_order_model_1.default.aggregate(pipeline).exec();
        return topSellingProducts;
    }
}
exports.default = new ProductReportService();

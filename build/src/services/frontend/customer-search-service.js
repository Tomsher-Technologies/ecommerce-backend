"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const collections_1 = require("../../constants/collections");
const product_model_1 = __importDefault(require("../../model/admin/ecommerce/product-model"));
const product_config_1 = require("../../utils/config/product-config");
const pagination_1 = require("../../components/pagination");
class CustomerSearchService {
    async customerSearch(productOption) {
        var { query, countryId, getbrand = '1', sort } = productOption;
        const { skip, limit } = (0, pagination_1.frontendPagination)(productOption.query || {}, productOption);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        const variantLookupMatch = {
            $expr: {
                $eq: ['$countryId', new mongoose_1.default.Types.ObjectId(countryId)]
            },
            status: "1"
        };
        const modifiedPipeline = {
            $lookup: {
                from: `${collections_1.collections.ecommerce.products.productvariants.productvariants}`,
                localField: '_id',
                foreignField: 'productId',
                as: 'productVariants',
                pipeline: [
                    { $match: variantLookupMatch },
                    {
                        $project: {
                            _id: 1,
                            countryId: 1,
                            productId: 1,
                            extraProductTitle: 1,
                        }
                    },
                ]
            }
        };
        let pipeline = [
            { $sort: finalSort },
            { $skip: skip },
            { $limit: limit },
            modifiedPipeline,
            product_config_1.productCategoryLookup,
            ...(getbrand === '1' ? [product_config_1.brandLookup, product_config_1.brandObject] : []),
            {
                $match: {
                    $and: [
                        query,
                        { productVariants: { $ne: [] } }
                    ]
                }
            },
        ];
        let productData = [];
        pipeline.push({
            $project: {
                _id: 1,
                productTitle: 1,
                brand: 1,
                productCategory: {
                    $ifNull: ['$productCategory', []]
                },
                productVariants: {
                    $ifNull: ['$productVariants', []]
                },
            }
        });
        productData = await product_model_1.default.aggregate(pipeline).exec();
        return productData;
    }
}
exports.default = new CustomerSearchService();

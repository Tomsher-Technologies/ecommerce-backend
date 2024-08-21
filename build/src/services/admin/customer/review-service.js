"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const pagination_1 = require("../../../components/pagination");
const customer_config_1 = require("../../../utils/config/customer-config");
const review_model_1 = __importDefault(require("../../../model/frontend/review-model"));
class ReviewService {
    async findAll(options = {}) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        const pipeline = [
            { $match: query },
            {
                $facet: {
                    reviewData: [
                        { $skip: skip },
                        { $limit: limit },
                        { $sort: finalSort }
                    ],
                    totalCount: [
                        { $count: 'count' }
                    ]
                }
            },
            {
                $project: {
                    reviewData: 1,
                    totalCount: { $arrayElemAt: ['$totalCount.count', 0] }
                }
            }
        ];
        const createdCartWithValues = await review_model_1.default.aggregate(pipeline);
        return createdCartWithValues;
    }
    async findOne(reviewId) {
        const pipeline = [
            customer_config_1.countriesLookup,
            customer_config_1.whishlistLookup,
            customer_config_1.orderLookup,
            customer_config_1.addField,
            customer_config_1.billingLookup,
            customer_config_1.shippingLookup,
            customer_config_1.orderWalletTransactionLookup,
            customer_config_1.referredWalletTransactionLookup,
            customer_config_1.referrerWalletTransactionLookup,
            { $match: { _id: mongoose_1.default.Types.ObjectId.createFromHexString(reviewId) } },
        ];
        const result = await review_model_1.default.aggregate(pipeline).exec();
        return result?.length > 0 ? result[0] : [];
    }
    async update(brandId, brandData) {
        const updatedBrand = await review_model_1.default.findByIdAndUpdate(brandId, brandData, { new: true, useFindAndModify: false });
        if (updatedBrand) {
            const pipeline = [
                { $match: { _id: updatedBrand._id } },
            ];
            const updatedBrandWithValues = await review_model_1.default.aggregate(pipeline);
            return updatedBrandWithValues[0];
        }
        else {
            return null;
        }
    }
}
exports.default = new ReviewService();

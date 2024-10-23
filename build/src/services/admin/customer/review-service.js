"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const review_model_1 = __importDefault(require("../../../model/frontend/review-model"));
const review_config_1 = require("../../../utils/config/review-config");
class ReviewService {
    async findAll(options = {}) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        let pipeline = [
            { $match: query },
            { $sort: finalSort },
        ];
        const facetPipeline = [
            {
                $facet: {
                    reviewData: [
                        { $skip: skip },
                        { $limit: limit },
                        ...review_config_1.reviewProductVariantLookup,
                        ...((query['customerId'] === '' || query['customerId'] === undefined) ? review_config_1.reviewCsutomerLookup : []),
                        ...((query['productId'] === '' || query['productId'] === undefined) ? review_config_1.reviewProductLookup : []),
                        {
                            $project: {
                                _id: 1,
                                countryId: 1,
                                customerId: 1,
                                productId: 1,
                                variantId: 1,
                                name: 1,
                                reviewTitle: 1,
                                reviewContent: 1,
                                reviewImageUrl1: 1,
                                reviewImageUrl2: 1,
                                rating: 1,
                                reviewStatus: 1,
                                approvedBy: 1,
                                createdAt: 1,
                                updatedAt: 1,
                                __v: 1,
                                customerName: 1,
                                customer: 1,
                                productDetails: 1,
                                variantDetails: 1
                            }
                        }
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
        if (query['customerId']) {
            pipeline.push(...review_config_1.reviewCsutomerLookup);
        }
        if (query['productId']) {
            pipeline.push(...review_config_1.reviewProductLookup);
        }
        pipeline.push(...facetPipeline);
        const createdCartWithValues = await review_model_1.default.aggregate(pipeline);
        return createdCartWithValues;
    }
    // async findOne(reviewId: string): Promise<any | null> {
    //     const pipeline = [
    //         countriesLookup,
    //         whishlistLookup,
    //         orderLookup,
    //         addField,
    //         billingLookup,
    //         shippingLookup,
    //         orderWalletTransactionLookup,
    //         referredWalletTransactionLookup,
    //         referrerWalletTransactionLookup,
    //         { $match: { _id: mongoose.Types.ObjectId.createFromHexString(reviewId) } },
    //     ];
    //     const result: any = await ReviewModel.aggregate(pipeline).exec();
    //     return result?.length > 0 ? result[0] : []
    // }
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

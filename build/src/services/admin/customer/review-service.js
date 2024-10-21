"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const review_model_1 = __importDefault(require("../../../model/frontend/review-model"));
const collections_1 = require("../../../constants/collections");
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
                $lookup: {
                    from: `${collections_1.collections.ecommerce.products.products}`,
                    localField: 'productId',
                    foreignField: '_id',
                    as: 'productDetails',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                starRating: 1,
                                productTitle: 1,
                                slug: 1
                            }
                        }
                    ]
                }
            },
            { $unwind: { path: '$productDetails', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: `${collections_1.collections.customer.customers}`,
                    localField: 'customerId',
                    foreignField: '_id',
                    as: 'customer',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                customerCode: 1,
                                email: 1,
                                firstName: 1,
                                phone: 1,
                                guestPhone: 1,
                                guestEmail: 1,
                                referralCode: 1,
                            }
                        }
                    ]
                }
            },
            { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: `${collections_1.collections.ecommerce.products.productvariants.productvariants}`,
                    localField: 'variantId',
                    foreignField: '_id',
                    as: 'variantDetails',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                variantSku: 1,
                                slug: 1,
                                extraProductTitle: 1,
                            }
                        }
                    ]
                }
            },
            { $unwind: { path: '$variantDetails', preserveNullAndEmptyArrays: true } },
            {
                $facet: {
                    reviewData: [
                        { $skip: skip },
                        { $limit: limit },
                        { $sort: finalSort },
                        {
                            $project: {
                                _id: 1,
                                customerId: 1,
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

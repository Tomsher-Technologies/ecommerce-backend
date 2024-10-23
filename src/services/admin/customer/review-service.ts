import mongoose from 'mongoose';
import { FilterOptionsProps, pagination } from '../../../components/pagination';
import ReviewModel, { ReviewProps } from '../../../model/frontend/review-model';
import { collections } from '../../../constants/collections';
import { reviewCsutomerLookup, reviewProductLookup, reviewProductVariantLookup } from '../../../utils/config/review-config';


class ReviewService {
    async findAll(options: FilterOptionsProps = {}): Promise<ReviewProps[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        let pipeline: any[] = [
            { $match: query },
            { $sort: finalSort },

        ];
        const facetPipeline = [
            {
                $facet: {
                    reviewData: [
                        { $skip: skip },
                        { $limit: limit },
                        ...reviewProductVariantLookup,
                        ...((query['customerId'] === '' || query['customerId'] === undefined) ? reviewCsutomerLookup : []),
                        ...((query['productId'] === '' || query['productId'] === undefined) ? reviewProductLookup : []),
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
        ]

        if (query['customerId']) {
            pipeline.push(...reviewCsutomerLookup)
        }
        if (query['productId']) {
            pipeline.push(...reviewProductLookup)
        }

        pipeline.push(...facetPipeline);
        
        const createdCartWithValues = await ReviewModel.aggregate(pipeline);
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

    async update(brandId: string, brandData: any): Promise<ReviewProps | null> {
        const updatedBrand = await ReviewModel.findByIdAndUpdate(
            brandId,
            brandData,
            { new: true, useFindAndModify: false }
        );

        if (updatedBrand) {
            const pipeline = [
                { $match: { _id: updatedBrand._id } },
            ];

            const updatedBrandWithValues = await ReviewModel.aggregate(pipeline);

            return updatedBrandWithValues[0];
        } else {
            return null;
        }
    }
}

export default new ReviewService();

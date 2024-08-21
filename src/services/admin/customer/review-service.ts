import mongoose from 'mongoose';
import { FilterOptionsProps, pagination } from '../../../components/pagination';
import { whishlistLookup, customerProject, addField, orderLookup, billingLookup, shippingLookup, customerDetailProject, orderWalletTransactionLookup, referredWalletTransactionLookup, referrerWalletTransactionLookup, countriesLookup, reportOrderLookup, addressLookup } from '../../../utils/config/customer-config';
import ReviewModel, { ReviewProps } from '../../../model/frontend/review-model';
import { productLookup, variantLookup } from '../../../utils/config/product-config';


class ReviewService {
    async findAll(options: FilterOptionsProps = {}): Promise<ReviewProps[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        const pipeline: any[] = [
            { $match: query },
            {
                $lookup: {
                    from: 'products',
                    localField: 'productId',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            {
                $unwind: {
                    path: '$productDetails',
                    preserveNullAndEmptyArrays: true
                }
            },

            // Lookup for variant details
            {
                $lookup: {
                    from: 'productvariants',
                    localField: 'variantId',
                    foreignField: '_id',
                    as: 'variantDetails'
                }
            },
            {
                $unwind: {
                    path: '$variantDetails',
                    preserveNullAndEmptyArrays: true
                }
            },
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
                                productId: {
                                    _id: '$productDetails._id',
                                    productTitle: '$productDetails.productTitle',
                                    slug: '$productDetails.slug'
                                },
                                name: 1,
                                reviewTitle: 1,
                                reviewContent: 1,
                                reviewImageUrl1: 1,
                                reviewImageUrl2: 1,
                                ReviewStatus: 1,
                                approvedBy: 1,
                                createdAt: 1,
                                updatedAt: 1,
                                __v: 1,
                                customerName: 1,
                                reviewStatus: 1,
                                variantId: {
                                    _id: '$variantDetails._id',
                                    variantSku: '$variantDetails.variantSku',
                                    slug: '$variantDetails.slug',
                                    extraProductTitle: '$variantDetails.extraProductTitle',
                                }
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

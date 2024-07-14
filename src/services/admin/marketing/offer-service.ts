import mongoose from 'mongoose';
import { FilterOptionsProps, pagination } from '../../../components/pagination';
import { collections } from '../../../constants/collections';
import { offers } from '../../../constants/offers';

import OffersModel, { OffersProps } from '../../../model/admin/marketing/offers-model';


class OfferService {
    private offerAddFields: any;
    private brandLookup: any;
    private categoriesLookup: any;
    private productsLookup: any;
    private offerReplacedNewRoot: any;

    constructor() {
        this.offerAddFields = {
            $addFields: {
                collectionName: {
                    $cond: {
                        if: { $eq: ["$offersBy", offers.brand] },
                        then: collections.ecommerce.brands,
                        else: {
                            $cond: {
                                if: { $eq: ["$offersBy", offers.category] },
                                then: collections.ecommerce.categories,
                                else: {
                                    $cond: {
                                        if: { $eq: ["$offersBy", offers.product] },
                                        then: collections.ecommerce.products.products,
                                        else: "defaultCollection",
                                    },
                                },
                            },
                        },
                    },
                },
            },
        };

        this.brandLookup = {
            $lookup: {
                from: collections.ecommerce.brands,
                let: { offerApplyValues: '$offerApplyValues' },
                pipeline: [
                    { $match: { $expr: { $in: [{ $toString: "$_id" }, "$$offerApplyValues"] } } },
                    {
                        $project: {
                            _id: 1,
                            brandTitle: 1,
                            slug: 1,
                            brandImageUrl: 1,
                            status: 1
                        }
                    }
                ],
                as: 'appliedValuesForBrand'
            }
        };


        this.categoriesLookup = {
            $lookup: {
                from: collections.ecommerce.categories,
                let: { offerApplyValues: '$offerApplyValues' },
                pipeline: [
                    { $match: { $expr: { $in: [{ $toString: "$_id" }, "$$offerApplyValues"] } } },
                    {
                        $project: {
                            _id: 1,
                            categoryTitle: 1,
                            slug: 1,
                            categoryImageUrl: 1,
                            status: 1
                        }
                    }
                ],
                as: 'appliedValuesForCategory'
            }
        };

        this.productsLookup = {
            $lookup: {
                from: collections.ecommerce.products.products,
                let: { offerApplyValues: '$offerApplyValues' },
                pipeline: [
                    { $match: { $expr: { $in: [{ $toString: "$_id" }, "$$offerApplyValues"] } } },
                ],
                as: 'appliedValuesForProduct'
            }
        };

        this.offerReplacedNewRoot = {
            newRoot: {
                $mergeObjects: ["$$ROOT", {
                    appliedValues: {
                        $concatArrays: ["$appliedValuesForBrand", "$appliedValuesForCategory", "$appliedValuesForProduct"]
                    }
                }]
            }
        }
    }
    async findAll(options: FilterOptionsProps = {}): Promise<OffersProps[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);

        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        let pipeline: any[] = [
            { $match: query },
            { $skip: skip },
            { $limit: limit },
            { $sort: finalSort },

            this.offerAddFields
        ];

        pipeline.push(
            this.brandLookup,
            this.categoriesLookup,
            this.productsLookup

        );

        pipeline.push({
            $replaceRoot: this.offerReplacedNewRoot
        });


        return OffersModel.aggregate(pipeline).exec();
    }
    async getTotalCount(query: any = {}): Promise<number> {
        try {
            const totalCount = await OffersModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of offers');
        }
    }

    async create(offerData: any): Promise<OffersProps> {
        return OffersModel.create(offerData);
    }

    async findOne(offerId: string): Promise<OffersProps | null> {

        const pipeline = [
            { $match: { _id: mongoose.Types.ObjectId.createFromHexString(offerId) } },
            this.offerAddFields,
            this.brandLookup,
            this.categoriesLookup,
            this.productsLookup,
            { $replaceRoot: this.offerReplacedNewRoot }
        ];

        const result: any = await OffersModel.aggregate(pipeline).exec();
        return result
    }

    async update(offerId: string, offerData: any): Promise<OffersProps | null> {
        const update: any = await OffersModel.findByIdAndUpdate(offerId, offerData, { new: true, useFindAndModify: false });
        const pipeline = [
            { $match: { _id: new mongoose.Types.ObjectId(update._id) } },
            this.offerAddFields,
            this.brandLookup,
            this.categoriesLookup,
            this.productsLookup,
            { $replaceRoot: this.offerReplacedNewRoot }
        ];
        const result: any = await OffersModel.aggregate(pipeline).exec();
        return result
    }

    async destroy(offerId: string): Promise<OffersProps | null> {
        return OffersModel.findOneAndDelete({ _id: offerId });
    }
}

export default new OfferService();

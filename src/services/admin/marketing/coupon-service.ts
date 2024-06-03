import { FilterOptionsProps, pagination } from '../../../components/pagination';
import { collections } from '../../../constants/collections';

import CouponModel, { CouponProps } from '../../../model/admin/marketing/coupon-model';
import mongoose from 'mongoose';


class CouponService {
    private couponAddFields: any;
    private brandLookup: any;
    private categoriesLookup: any;
    private productsLookup: any;
    private couponReplacedNewRoot: any;

    constructor() {
        this.couponAddFields = {
            $addFields: {
                collectionName: {
                    $cond: {
                        if: { $eq: ["$couponType", "for-brand"] },
                        then: collections.ecommerce.brands,
                        else: {
                            $cond: {
                                if: { $eq: ["$couponType", "for-category"] },
                                then: collections.ecommerce.categories,
                                else: {
                                    $cond: {
                                        if: { $eq: ["$couponType", "for-product"] },
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
                let: { couponApplyValues: '$couponApplyValues' },
                pipeline: [
                    { $match: { $expr: { $in: [{ $toString: "$_id" }, "$$couponApplyValues"] } } },
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
                let: { couponApplyValues: '$couponApplyValues' },
                pipeline: [
                    { $match: { $expr: { $in: [{ $toString: "$_id" }, "$$couponApplyValues"] } } },
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
                let: { couponApplyValues: '$couponApplyValues' },
                pipeline: [
                    { $match: { $expr: { $in: [{ $toString: "$_id" }, "$$couponApplyValues"] } } },
                ],
                as: 'appliedValuesForProduct'
            }
        };

        this.couponReplacedNewRoot = {
            newRoot: {
                $mergeObjects: ["$$ROOT", {
                    appliedValues: {
                        $concatArrays: ["$appliedValuesForBrand", "$appliedValuesForCategory", "$appliedValuesForProduct"]
                    }
                }]
            }
        }
    }

    async findAll(options: FilterOptionsProps = {}): Promise<CouponProps[]> {
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

            this.couponAddFields,
            this.brandLookup,
            this.categoriesLookup,
            this.productsLookup,
            { $replaceRoot: this.couponReplacedNewRoot }
        ];


        return CouponModel.aggregate(pipeline).exec();
    }



    async getTotalCount(query: any = {}): Promise<number> {
        try {
            const totalCount = await CouponModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of coupons');
        }
    }

    async create(couponData: any): Promise<CouponProps> {
        return CouponModel.create(couponData);
    }

    async findOne(couponId: string): Promise<CouponProps | null> {
        const pipeline = [
            { $match: { _id: mongoose.Types.ObjectId.createFromHexString(couponId) } },
            this.couponAddFields,
            this.brandLookup,
            this.categoriesLookup,
            this.productsLookup,
            { $replaceRoot: this.couponReplacedNewRoot }
        ];

        const result = await CouponModel.aggregate(pipeline).exec();
        return result.length > 0 ? result[0] : null;
    }

    async update(couponId: string, couponData: any): Promise<CouponProps | null> {
        return CouponModel.findByIdAndUpdate(couponId, couponData, { new: true, useFindAndModify: false });
    }

    async destroy(couponId: string): Promise<CouponProps | null> {
        return CouponModel.findOneAndDelete({ _id: couponId });
    }
}

export default new CouponService();

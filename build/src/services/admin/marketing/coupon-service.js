"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const collections_1 = require("../../../constants/collections");
const coupon_model_1 = __importDefault(require("../../../model/admin/marketing/coupon-model"));
const mongoose_1 = __importDefault(require("mongoose"));
class CouponService {
    constructor() {
        this.couponAddFields = {
            $addFields: {
                collectionName: {
                    $cond: {
                        if: { $eq: ["$couponType", "for-brand"] },
                        then: collections_1.collections.ecommerce.brands,
                        else: {
                            $cond: {
                                if: { $eq: ["$couponType", "for-category"] },
                                then: collections_1.collections.ecommerce.categories,
                                else: {
                                    $cond: {
                                        if: { $eq: ["$couponType", "for-product"] },
                                        then: collections_1.collections.ecommerce.products.products,
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
                from: collections_1.collections.ecommerce.brands,
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
                from: collections_1.collections.ecommerce.categories,
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
                from: collections_1.collections.ecommerce.products.products,
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
        };
    }
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
            { $skip: skip },
            { $limit: limit },
            { $sort: finalSort },
            this.couponAddFields,
            this.brandLookup,
            this.categoriesLookup,
            this.productsLookup,
            { $replaceRoot: this.couponReplacedNewRoot }
        ];
        return coupon_model_1.default.aggregate(pipeline).exec();
    }
    async getTotalCount(query = {}) {
        try {
            const totalCount = await coupon_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of coupons');
        }
    }
    async create(couponData) {
        return coupon_model_1.default.create(couponData);
    }
    async findOne(couponId) {
        const pipeline = [
            { $match: { _id: mongoose_1.default.Types.ObjectId.createFromHexString(couponId) } },
            this.couponAddFields,
            this.brandLookup,
            this.categoriesLookup,
            this.productsLookup,
            { $replaceRoot: this.couponReplacedNewRoot }
        ];
        const result = await coupon_model_1.default.aggregate(pipeline).exec();
        return result.length > 0 ? result[0] : null;
    }
    async update(couponId, couponData) {
        return coupon_model_1.default.findByIdAndUpdate(couponId, couponData, { new: true, useFindAndModify: false });
    }
    async destroy(couponId) {
        return coupon_model_1.default.findOneAndDelete({ _id: couponId });
    }
}
exports.default = new CouponService();

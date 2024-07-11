"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const pagination_1 = require("../../../components/pagination");
const collections_1 = require("../../../constants/collections");
const offers_model_1 = __importDefault(require("../../../model/admin/marketing/offers-model"));
class OfferService {
    constructor() {
        this.offerAddFields = {
            $addFields: {
                collectionName: {
                    $cond: {
                        if: { $eq: ["$offersBy", "brand"] },
                        then: collections_1.collections.ecommerce.brands,
                        else: {
                            $cond: {
                                if: { $eq: ["$offersBy", "category"] },
                                then: collections_1.collections.ecommerce.categories,
                                else: {
                                    $cond: {
                                        if: { $eq: ["$offersBy", "product"] },
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
                from: collections_1.collections.ecommerce.categories,
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
                from: collections_1.collections.ecommerce.products.products,
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
            this.offerAddFields
        ];
        pipeline.push(this.brandLookup, this.categoriesLookup, this.productsLookup);
        pipeline.push({
            $replaceRoot: this.offerReplacedNewRoot
        });
        return offers_model_1.default.aggregate(pipeline).exec();
    }
    async getTotalCount(query = {}) {
        try {
            const totalCount = await offers_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of offers');
        }
    }
    async create(offerData) {
        return offers_model_1.default.create(offerData);
    }
    async findOne(offerId) {
        const pipeline = [
            { $match: { _id: mongoose_1.default.Types.ObjectId.createFromHexString(offerId) } },
            this.offerAddFields,
            this.brandLookup,
            this.categoriesLookup,
            this.productsLookup,
            { $replaceRoot: this.offerReplacedNewRoot }
        ];
        const result = await offers_model_1.default.aggregate(pipeline).exec();
        return result;
    }
    async update(offerId, offerData) {
        const update = await offers_model_1.default.findByIdAndUpdate(offerId, offerData, { new: true, useFindAndModify: false });
        const pipeline = [
            { $match: { _id: new mongoose_1.default.Types.ObjectId(update._id) } },
            this.offerAddFields,
            this.brandLookup,
            this.categoriesLookup,
            this.productsLookup,
            { $replaceRoot: this.offerReplacedNewRoot }
        ];
        const result = await offers_model_1.default.aggregate(pipeline).exec();
        return result;
    }
    async destroy(offerId) {
        return offers_model_1.default.findOneAndDelete({ _id: offerId });
    }
}
exports.default = new OfferService();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const pagination_1 = require("../../../components/pagination");
const collections_1 = require("../../../constants/collections");
const offers_1 = require("../../../constants/offers");
const offers_model_1 = __importDefault(require("../../../model/admin/marketing/offers-model"));
const product_model_1 = __importDefault(require("../../../model/admin/ecommerce/product-model"));
const product_category_link_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-category-link-model"));
const category_model_1 = __importDefault(require("../../../model/admin/ecommerce/category-model"));
class OfferService {
    constructor() {
        this.offerAddFields = {
            $addFields: {
                collectionName: {
                    $cond: {
                        if: { $eq: ["$offersBy", offers_1.offersByTypes.brand] },
                        then: collections_1.collections.ecommerce.brands,
                        else: {
                            $cond: {
                                if: { $eq: ["$offersBy", offers_1.offersByTypes.category] },
                                then: collections_1.collections.ecommerce.categories,
                                else: {
                                    $cond: {
                                        if: { $eq: ["$offersBy", offers_1.offersByTypes.product] },
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
    async setOfferApplicableProducts(offer) {
        let { countryId, offerIN, offerType, offersBy, offerApplyValues, applicableProducts, offerDateRange } = offer;
        let productIds = [];
        const offerStartDate = new Date(offerDateRange[0]);
        const offerEndDate = new Date(offerDateRange[1]);
        const currentDate = new Date();
        if (currentDate < offerEndDate) {
            if (offers_1.offersByTypes.product === offersBy) {
                productIds = offerApplyValues;
                applicableProducts = offerApplyValues;
            }
            else if (offers_1.offersByTypes.brand === offersBy) {
                productIds = await product_model_1.default.distinct("_id", { brand: offerApplyValues.map((value) => new mongoose_1.default.Types.ObjectId(value)) });
            }
            else if (offers_1.offersByTypes.category === offersBy) {
                async function fetchAllCategories(categoryIds) {
                    let queue = [...categoryIds];
                    const allCategoryIds = new Set([...categoryIds]);
                    while (queue.length > 0) {
                        const categoriesData = await category_model_1.default.find({ parentCategory: { $in: queue } }, '_id');
                        const childCategoryIds = categoriesData.map(category => category._id);
                        if (childCategoryIds.length === 0) {
                            break;
                        }
                        queue = childCategoryIds;
                        childCategoryIds.forEach(id => allCategoryIds.add(id));
                    }
                    return Array.from(allCategoryIds);
                }
                const fetchCategoryId = async (categoryValue) => {
                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(categoryValue);
                    return isObjectId ? categoryValue : (await category_model_1.default.findOne({ slug: categoryValue }, '_id'))?._id || null;
                };
                let categoryBatchIds = [];
                const allCategoryIds = await Promise.all(offerApplyValues.map(fetchCategoryId));
                categoryBatchIds.push(...allCategoryIds.filter(Boolean));
                const categoryIds = await fetchAllCategories([...new Set(categoryBatchIds)]);
                productIds = await product_category_link_model_1.default.distinct('productId', { categoryId: { $in: categoryIds } });
            }
            if (productIds.length > 0) {
                // awai ProductVariantsModel
            }
            return;
        }
        else {
            console.log("The offer is still valid.");
        }
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
        const [result] = await offers_model_1.default.aggregate(pipeline).exec();
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

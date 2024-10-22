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
const product_variants_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-variants-model"));
const offer_1 = require("../../../utils/admin/offer");
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
        const { _id, countryId, offerIN, offerType, offersBy, offerApplyValues, offerDateRange } = offer;
        const offerEndDate = new Date(offerDateRange[1]);
        const currentDate = new Date();
        if (currentDate >= offerEndDate) {
            console.log('Offer has expired');
            return;
        }
        let productIds = [];
        if (offersBy === offers_1.offersByTypes.product) {
            productIds = offerApplyValues;
        }
        else if (offersBy === offers_1.offersByTypes.brand) {
            productIds = await product_model_1.default.distinct("_id", {
                brand: offerApplyValues.map((value) => new mongoose_1.default.Types.ObjectId(value)),
            });
        }
        else if (offersBy === offers_1.offersByTypes.category) {
            productIds = await this.fetchCategoryProducts(offerApplyValues);
        }
        if (productIds.length === 0) {
            console.log('No products found for the offer');
            return;
        }
        const productVariants = await product_variants_model_1.default.find({ productId: { $in: productIds }, countryId });
        if (!productVariants || productVariants.length === 0) {
            console.log('No product variants found for the products');
            return;
        }
        console.log('productVariants', productVariants.find((varia) => varia.productId.toString() === '66d4177ce3cfc14ddcb8ba7e'));
        const bulkOps = productVariants.map(productVariant => {
            const { _id: variantId, productId, price, discountPrice, offerData } = productVariant;
            const basePrice = discountPrice > 0 ? discountPrice : price;
            const newOfferPrice = (0, offer_1.calculateOfferPrice)(offerType, offerIN, basePrice);
            if ((0, offer_1.shouldUpdateOffer)(offersBy, offerData?.offersBy)) {
                return {
                    updateOne: {
                        filter: { _id: variantId, countryId },
                        update: {
                            $set: {
                                offerId: _id,
                                offerPrice: newOfferPrice,
                                offerData: { offerIN, offerType, offersBy, offerDateRange, offerUpdatedAt: new Date() },
                            },
                        },
                    },
                };
            }
            else {
                console.log(`Skipping update for productId: ${productId} | Current offersBy: ${offerData?.offersBy} | New offersBy: ${offersBy}`);
                return null;
            }
        }).filter(Boolean);
        console.log('bulkOps', bulkOps.length);
        if (bulkOps.length > 0) {
            const bulkWriteResult = await product_variants_model_1.default.bulkWrite(bulkOps);
            console.log(`Bulk write completed. Matched: ${bulkWriteResult.matchedCount}, Modified: ${bulkWriteResult.modifiedCount}`);
        }
        else {
            console.log('No updates required.');
        }
    }
    async fetchCategoryProducts(categoryIds) {
        const fetchAllCategories = async (categoryIds) => {
            let queue = [...categoryIds];
            const allCategoryIds = new Set(categoryIds);
            while (queue.length > 0) {
                const categoriesData = await category_model_1.default.find({ parentCategory: { $in: queue } }, '_id');
                const childCategoryIds = categoriesData.map(category => category._id);
                if (childCategoryIds.length === 0)
                    break;
                queue = childCategoryIds;
                childCategoryIds.forEach(id => allCategoryIds.add(id));
            }
            return Array.from(allCategoryIds);
        };
        const normalizedCategoryIds = categoryIds.map((id) => new mongoose_1.default.Types.ObjectId(id));
        const allCategoryIds = await fetchAllCategories(normalizedCategoryIds);
        const productIds = product_category_link_model_1.default.distinct('productId', { categoryId: { $in: allCategoryIds } });
        return productIds;
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
        const [result] = await offers_model_1.default.aggregate(pipeline).exec();
        return result;
    }
    // async setOfferApplicableProducts(offer: any): Promise<any> {
    //     let { _id, countryId, offerIN, offerType, offersBy, offerApplyValues, applicableProducts, offerDateRange } = offer;
    //     let productIds = [];
    //     const offerEndDate = new Date(offerDateRange[1]);
    //     const currentDate = new Date();
    //     if (offerEndDate && currentDate < offerEndDate) {
    //         if (offersByTypes.product === offersBy) {
    //             productIds = offerApplyValues;
    //             applicableProducts = offerApplyValues
    //         } else if (offersByTypes.brand === offersBy) {
    //             productIds = await ProductsModel.distinct("_id", { brand: offerApplyValues.map((value: any) => new mongoose.Types.ObjectId(value)) });
    //         } else if (offersByTypes.category === offersBy) {
    //             async function fetchAllCategories(categoryIds: any[]): Promise<any[]> {
    //                 let queue = [...categoryIds];
    //                 const allCategoryIds = new Set([...categoryIds]);
    //                 while (queue.length > 0) {
    //                     const categoriesData = await CategoryModel.find(
    //                         { parentCategory: { $in: queue } },
    //                         '_id'
    //                     );
    //                     const childCategoryIds = categoriesData.map(category => category._id);
    //                     if (childCategoryIds.length === 0) {
    //                         break;
    //                     }
    //                     queue = childCategoryIds;
    //                     childCategoryIds.forEach(id => allCategoryIds.add(id));
    //                 }
    //                 return Array.from(allCategoryIds);
    //             }
    //             const fetchCategoryId = async (categoryValue: string) => {
    //                 const isObjectId = /^[0-9a-fA-F]{24}$/.test(categoryValue);
    //                 return isObjectId ? categoryValue : (await CategoryModel.findOne({ slug: categoryValue }, '_id'))?._id || null;
    //             };
    //             let categoryBatchIds = [];
    //             const allCategoryIds = await Promise.all(offerApplyValues.map(fetchCategoryId));
    //             categoryBatchIds.push(...allCategoryIds.filter(Boolean));
    //             const categoryIds = await fetchAllCategories([...new Set(categoryBatchIds)]);
    //             productIds = await ProductCategoryLinkModel.distinct('productId', { categoryId: { $in: categoryIds } });
    //         }
    //         if (productIds.length > 0) {
    //             await Promise.all(
    //                 productIds.map(async (productId: string) => {
    //                     const productVariant = await ProductVariantsModel.findOne({ productId });
    //                     if (!productVariant) return;
    //                     const { price, discountPrice, offerData }: any = productVariant;
    //                     let basePrice = discountPrice > 0 ? discountPrice : price;
    //                     let newOfferPrice = 0;
    //                     if (offerType === offerTypes.percent) {
    //                         const discountPercentage = Number(offerIN);
    //                         newOfferPrice = basePrice - (basePrice * (discountPercentage / 100));
    //                     } else if (offerType === offerTypes.amountOff) {
    //                         const discountAmount = Number(offerIN);
    //                         newOfferPrice = basePrice - discountAmount;
    //                     }
    //                     if (offerData && offerData?.offerType) {
    //                         const existingOffersBy = offerData.offersBy;
    //                         console.log('existingOffersBy', existingOffersBy);
    //                         if (offersBy === offersByTypes.brand) {
    //                             if (existingOffersBy === offersByTypes.category) {
    //                                 console.log(`Skipping update for productId ${productId}: existing offer is 'category'`);
    //                                 return;
    //                             }
    //                             console.log(`Updating 'brand' offer for productId ${productId}`);
    //                         } else if (offersBy === offersByTypes.product) {
    //                             if (existingOffersBy === offersByTypes.category || existingOffersBy === offersByTypes.brand) {
    //                                 console.log(`Skipping update for productId ${productId}: existing offer is 'category' or 'brand'`);
    //                                 return;
    //                             }
    //                             console.log(`Updating 'product' offer for productId ${productId}`);
    //                         }
    //                     }
    //                     await ProductVariantsModel.updateOne(
    //                         { productId, countryId }, {
    //                         $set: {
    //                             offerId: _id,
    //                             offerPrice: newOfferPrice,
    //                             offerData: {
    //                                 offerIN,
    //                                 offerType,
    //                                 offersBy
    //                             }
    //                         }
    //                     });
    //                 })
    //             );
    //         }
    //         return;
    //     }
    //     return;
    // }
    async destroy(offerId) {
        return offers_model_1.default.findOneAndDelete({ _id: offerId });
    }
}
exports.default = new OfferService();

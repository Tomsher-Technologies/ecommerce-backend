import mongoose, { ObjectId } from 'mongoose';
import { FilterOptionsProps, pagination } from '../../../components/pagination';
import { collections } from '../../../constants/collections';
import { offerTypes, offersByTypes } from '../../../constants/offers';

import OffersModel, { OffersProps } from '../../../model/admin/marketing/offers-model';
import ProductsModel from '../../../model/admin/ecommerce/product-model';
import ProductCategoryLinkModel from '../../../model/admin/ecommerce/product/product-category-link-model';
import CategoryModel from '../../../model/admin/ecommerce/category-model';
import ProductVariantsModel from '../../../model/admin/ecommerce/product/product-variants-model';
import { calculateOfferPrice, shouldUpdateOffer } from '../../../utils/admin/offer';


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
                        if: { $eq: ["$offersBy", offersByTypes.brand] },
                        then: collections.ecommerce.brands,
                        else: {
                            $cond: {
                                if: { $eq: ["$offersBy", offersByTypes.category] },
                                then: collections.ecommerce.categories,
                                else: {
                                    $cond: {
                                        if: { $eq: ["$offersBy", offersByTypes.product] },
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

    async setOfferApplicableProducts(offer: any): Promise<any> {
        const { _id, countryId, offerIN, offerType, offersBy, offerApplyValues, offerDateRange } = offer;

        const offerEndDate = new Date(offerDateRange[1]);
        const currentDate = new Date();
        if (currentDate >= offerEndDate) {
            console.log('Offer has expired');
            return;
        }
        let productIds: string[] = [];
        if (offersBy === offersByTypes.product) {
            productIds = offerApplyValues;
        } else if (offersBy === offersByTypes.brand) {
            productIds = await ProductsModel.distinct("_id", {
                brand: offerApplyValues.map((value: any) => new mongoose.Types.ObjectId(value)),
            });
        } else if (offersBy === offersByTypes.category) {
            productIds = await this.fetchCategoryProducts(offerApplyValues);
        }

        if (productIds.length === 0) {
            console.log('No products found for the offer');
            return;
        }
        const productVariants = await ProductVariantsModel.find({ productId: { $in: productIds }, countryId });

        if (!productVariants || productVariants.length === 0) {
            console.log('No product variants found for the products');
            return;
        }
        const bulkOps: any = productVariants.map(productVariant => {
            const { productId, price, discountPrice, offerData }: any = productVariant;
            const basePrice = discountPrice > 0 ? discountPrice : price;
            const newOfferPrice = calculateOfferPrice(offerType, offerIN, basePrice);

            if (shouldUpdateOffer(offersBy, offerData?.offersBy)) {
                return {
                    updateMany: {
                        filter: { productId, countryId },
                        update: {
                            $set: {
                                offerId: _id,
                                offerPrice: newOfferPrice,
                                offerData: { offerIN, offerType, offersBy, offerDateRange, offerUpdatedAt: new Date() },
                            },
                        },
                    },
                };
            } else {
                console.log(`Skipping update for productId: ${productId} | Current offersBy: ${offerData?.offersBy} | New offersBy: ${offersBy}`);
                return null;
            }
        }).filter(Boolean);

        if (bulkOps.length > 0) {
            const bulkWriteResult = await ProductVariantsModel.bulkWrite(bulkOps);
            console.log(`Bulk write completed. Matched: ${bulkWriteResult.matchedCount}, Modified: ${bulkWriteResult.modifiedCount}`);
        } else {
            console.log('No updates required.');
        }
    }


    async fetchCategoryProducts(categoryIds: (string | ObjectId)[]): Promise<string[]> {
        const fetchAllCategories = async (categoryIds: ObjectId[]): Promise<ObjectId[]> => {
            let queue = [...categoryIds];
            const allCategoryIds = new Set<ObjectId>(categoryIds);
            while (queue.length > 0) {
                const categoriesData = await CategoryModel.find({ parentCategory: { $in: queue } }, '_id');
                const childCategoryIds = categoriesData.map(category => category._id);
                if (childCategoryIds.length === 0) break;

                queue = childCategoryIds;
                childCategoryIds.forEach(id => allCategoryIds.add(id));
            }

            return Array.from(allCategoryIds);
        };

        const normalizedCategoryIds: any = categoryIds.map((id: any) => new mongoose.Types.ObjectId(id));

        const allCategoryIds = await fetchAllCategories(normalizedCategoryIds);

        const productIds: any = ProductCategoryLinkModel.distinct('productId', { categoryId: { $in: allCategoryIds } });
        return productIds
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

        const [result]: any = await OffersModel.aggregate(pipeline).exec();
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
        const [result]: any = await OffersModel.aggregate(pipeline).exec();
        return result
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

    async destroy(offerId: string): Promise<OffersProps | null> {
        return OffersModel.findOneAndDelete({ _id: offerId });
    }
}

export default new OfferService();

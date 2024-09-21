import mongoose from 'mongoose';
import { FilterOptionsProps, pagination } from '../../../components/pagination';
import { collections } from '../../../constants/collections';
import { offerTypes, offersByTypes } from '../../../constants/offers';

import OffersModel, { OffersProps } from '../../../model/admin/marketing/offers-model';
import ProductsModel from '../../../model/admin/ecommerce/product-model';
import ProductCategoryLinkModel from '../../../model/admin/ecommerce/product/product-category-link-model';
import CategoryModel from '../../../model/admin/ecommerce/category-model';
import ProductVariantsModel from '../../../model/admin/ecommerce/product/product-variants-model';


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
        let { _id, countryId, offerIN, offerType, offersBy, offerApplyValues, applicableProducts, offerDateRange } = offer;
        let productIds = [];



        const offerStartDate = new Date(offerDateRange[0]);
        const offerEndDate = new Date(offerDateRange[1]);
        const currentDate = new Date();
        if (currentDate < offerEndDate) {
            if (offersByTypes.product === offersBy) {
                productIds = offerApplyValues;
                applicableProducts = offerApplyValues
            } else if (offersByTypes.brand === offersBy) {
                productIds = await ProductsModel.distinct("_id", { brand: offerApplyValues.map((value: any) => new mongoose.Types.ObjectId(value)) });
            } else if (offersByTypes.category === offersBy) {
                async function fetchAllCategories(categoryIds: any[]): Promise<any[]> {
                    let queue = [...categoryIds];
                    const allCategoryIds = new Set([...categoryIds]);
                    while (queue.length > 0) {
                        const categoriesData = await CategoryModel.find(
                            { parentCategory: { $in: queue } },
                            '_id'
                        );
                        const childCategoryIds = categoriesData.map(category => category._id);
                        if (childCategoryIds.length === 0) {
                            break;
                        }
                        queue = childCategoryIds;
                        childCategoryIds.forEach(id => allCategoryIds.add(id));
                    }
                    return Array.from(allCategoryIds);
                }
                const fetchCategoryId = async (categoryValue: string) => {
                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(categoryValue);
                    return isObjectId ? categoryValue : (await CategoryModel.findOne({ slug: categoryValue }, '_id'))?._id || null;
                };
                let categoryBatchIds = [];
                const allCategoryIds = await Promise.all(offerApplyValues.map(fetchCategoryId));
                categoryBatchIds.push(...allCategoryIds.filter(Boolean));

                const categoryIds = await fetchAllCategories([...new Set(categoryBatchIds)]);
                productIds = await ProductCategoryLinkModel.distinct('productId', { categoryId: { $in: categoryIds } });
            }
            if (productIds.length > 0) {
                await Promise.all(
                    ['66eaaafd56d661c48e7f80ce'].map(async (productId: string) => {
                        const productVariant = await ProductVariantsModel.findOne({ productId: new mongoose.Types.ObjectId('66eaaafd56d661c48e7f80ce') });
                        if (!productVariant) return;
                        const { price, discountPrice } = productVariant;
                        let basePrice = discountPrice > 0 ? discountPrice : price;
                        let offerPrice = 0;
                        if (offerType === offerTypes.percent) {
                            const discountPercentage = offerIN;
                            offerPrice = basePrice - (basePrice * (discountPercentage / 100));
                        } else if (offerType === offerTypes.amountOff) {
                            const discountAmount = offerIN;
                            offerPrice = basePrice - discountAmount;
                        }
                        await ProductVariantsModel.updateOne(
                            { productId, countryId }, {
                            $set: {
                                offerId: _id,
                                offerPrice,
                                offerData: {
                                    offerIN,
                                    offerType,
                                    offersBy
                                }
                            }
                        }
                        );
                        console.log('Offer prices updated for product variants.', offerPrice);
                    })
                );

            }
            // console.log('productIds', productIds);

            return;
        } else {
            console.log("The offer is still valid.");
        }

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
        const result: any = await OffersModel.aggregate(pipeline).exec();
        return result
    }

    async destroy(offerId: string): Promise<OffersProps | null> {
        return OffersModel.findOneAndDelete({ _id: offerId });
    }
}

export default new OfferService();

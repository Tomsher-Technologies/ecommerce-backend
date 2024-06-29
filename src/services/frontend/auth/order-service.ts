
import mongoose from 'mongoose';
import { FilterOptionsProps, frontendPagination, pagination } from '../../../components/pagination';
import CartOrderModel, { CartOrderProps } from '../../../model/frontend/cart-order-model';
import { multilanguageFieldsLookup, productVariantsLookupValues, replaceProductLookupValues, wishlistOfferBrandPopulation, wishlistOfferCategory, wishlistOfferProductPopulation, wishlistProductCategoryLookup } from '../../../utils/config/wishlist-config';
import { addFieldsProductVariantAttributes, brandLookup, brandObject, productCategoryLookup, productLookup, productProject, productVariantAttributesLookup } from '../../../utils/config/product-config';
import { getLanguageValueFromSubdomain } from '../../../utils/frontend/sub-domain';
import LanguagesModel from '../../../model/admin/setup/language-model';
import commonService from './../guest/common-service';


class CartService {

    private cartLookup: any;

    constructor() {
        this.cartLookup = {
            $lookup: {
                from: 'cartorderproducts', // Collection name of AttributeDetailModel
                localField: '_id', // Field in AttributesModel
                foreignField: 'cartId', // Field in AttributeDetailModel
                as: 'products',

            }
        };


    }
    async OrderList(options: any): Promise<CartOrderProps[]> {

        const { query, skip, limit, sort, hostName } = frontendPagination(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        const languageData = await LanguagesModel.find().exec();
        const languageId = await getLanguageValueFromSubdomain(hostName, languageData)

        const { pipeline: offerPipeline, getOfferList, offerApplied } = await commonService.findOffers(0, hostName);

        // productVariantAttributesLookup
        const modifiedPipeline = {
            $lookup: {
                ...this.cartLookup.$lookup,
                pipeline: [
                    productLookup,
                    { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
                    productVariantsLookupValues("1"),
                    // attributePipeline,
                    { $unwind: { path: "$productDetails.variantDetails", preserveNullAndEmptyArrays: true } },
                    wishlistProductCategoryLookup,
                    multilanguageFieldsLookup(languageId),
                    { $unwind: { path: "$productDetails.languageValues", preserveNullAndEmptyArrays: true } },
                    replaceProductLookupValues,
                    { $unset: "productDetails.languageValues" },

                ]
            }
        };

        const pipeline: any[] = [
            modifiedPipeline,
            { $match: query },

            { $sort: finalSort },

        ];
        if (offerApplied.category.categories && offerApplied.category.categories.length > 0) {
            const offerCategory = wishlistOfferCategory(getOfferList, offerApplied.category)
            modifiedPipeline.$lookup.pipeline.push(offerCategory);
        }
        if (offerApplied.brand.brands && offerApplied.brand.brands.length > 0) {
            const offerBrand = wishlistOfferBrandPopulation(getOfferList, offerApplied.brand)

            modifiedPipeline.$lookup.pipeline.push(offerBrand);
        }
        if (offerApplied.product.products && offerApplied.product.products.length > 0) {
            const offerProduct = wishlistOfferProductPopulation(getOfferList, offerApplied.product)
            modifiedPipeline.$lookup.pipeline.push(offerProduct)

        }


        modifiedPipeline.$lookup.pipeline.push({
            $addFields: {
                'productDetails.offer': {
                    $cond: {
                        if: "$productDetails.categoryOffers",
                        then: "$productDetails.categoryOffers",
                        else: {
                            $cond: {
                                if: "$brandOffers",
                                then: "$productDetails.brandOffers",
                                else: "$productDetails.productOffers"
                            }
                        }
                    }
                }
            }
        });
        modifiedPipeline.$lookup.pipeline.push({ $unset: "productDetails.categoryOffers" })
        modifiedPipeline.$lookup.pipeline.push({ $unset: "productDetails.brandOffers" })
        modifiedPipeline.$lookup.pipeline.push({ $unset: "productDetails.productOffers" })



        if (skip) {
            pipeline.push({ $skip: skip });
        }

        if (limit) {
            pipeline.push({ $limit: limit });
        }

        const createdCartWithValues = await CartOrderModel.aggregate(pipeline);
        // console.log("createdCartWithValues", createdCartWithValues);

        return createdCartWithValues;
        // return CartOrderModel.findOne(data);
    }

}

export default new CartService();

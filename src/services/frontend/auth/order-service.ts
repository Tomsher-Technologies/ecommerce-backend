
import mongoose from 'mongoose';
import { FilterOptionsProps, frontendPagination, pagination } from '../../../components/pagination';
import CartOrderModel, { CartOrderProps } from '../../../model/frontend/cart-order-model';
import { multilanguageFieldsLookup, productVariantsLookupValues, replaceProductLookupValues, wishlistOfferBrandPopulation, wishlistOfferCategory, wishlistOfferProductPopulation, wishlistProductCategoryLookup } from '../../../utils/config/wishlist-config';
import { addFieldsProductVariantAttributes, brandLookup, brandObject, productCategoryLookup, productLookup, productProject, productVariantAttributesLookup } from '../../../utils/config/product-config';
import { getLanguageValueFromSubdomain } from '../../../utils/frontend/sub-domain';
import LanguagesModel from '../../../model/admin/setup/language-model';
import commonService from './../guest/common-service';
import { billingLookup, cartProject, objectLookup, paymentMethodLookup, shippingLookup } from '../../../utils/config/cart-order-config';


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
    async orderList(options: any): Promise<CartOrderProps[]> {

        const { query, skip, limit, sort, hostName } = frontendPagination(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        const languageData = await LanguagesModel.find().exec();
        const languageId = await getLanguageValueFromSubdomain(hostName, languageData)

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
            shippingLookup,
            billingLookup,
            paymentMethodLookup,
            objectLookup,
            // cartProject,
            { $match: query },

            { $sort: finalSort },

        ];

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

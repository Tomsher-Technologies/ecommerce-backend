
import { frontendPagination } from '../../../components/pagination';
import { multilanguageFieldsLookup, productVariantsLookupValues, replaceProductLookupValues, wishlistProductCategoryLookup } from '../../../utils/config/wishlist-config';
import { productLookup } from '../../../utils/config/product-config';
import { getLanguageValueFromSubdomain } from '../../../utils/frontend/sub-domain';
import { cartDeatilProject, cartProductsLookup, cartProject, orderListObjectLookup, paymentMethodLookup, shippingAndBillingLookup } from '../../../utils/config/cart-order-config';

import CartOrderModel, { CartOrderProps } from '../../../model/frontend/cart-order-model';
import LanguagesModel from '../../../model/admin/setup/language-model';

class OederService {

    async orderList(options: any): Promise<CartOrderProps[]> {

        const { query, skip, limit, sort, hostName } = frontendPagination(options.query || {}, options);
        const { getAddress, getCartProducts } = options;

        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        const languageData = await LanguagesModel.find().exec();
        const languageId = await getLanguageValueFromSubdomain(hostName, languageData)

        const modifiedPipeline = {
            $lookup: {
                ...cartProductsLookup.$lookup,
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
            ...(getCartProducts === '1' ? [modifiedPipeline] : [cartProductsLookup]),
            ...(getAddress === '1' ? shippingAndBillingLookup('shippingId', 'shippingAddress') : []),
            ...(getAddress === '1' ? shippingAndBillingLookup('billingId', 'billingAddress') : []),
            paymentMethodLookup,
            orderListObjectLookup,

            { $match: query },
            { $sort: finalSort },
            ...(getCartProducts === '1' ? [cartDeatilProject] : [cartProject]),

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

export default new OederService();

import { pagination } from '../../components/pagination';
import { blockReferences, websiteSetup } from '../../constants/website-setup';
import CartOrderModel, { CartOrderProps } from '../../model/frontend/cart-order-model';
import { cartDeatilSimpleProject, cartProductsLookup, cartProject, couponLookup, customerLookup, getOrderProductsWithCartLookup, orderListObjectLookup, paymentMethodLookup, pickupStoreLookupPipeline, shippingAndBillingLookup, } from '../../utils/config/cart-order-config';
import { countriesLookup } from '../../utils/config/customer-config';
import { productLookup } from '../../utils/config/product-config';
import { productVariantsLookupValues } from '../../utils/config/wishlist-config';

class SapOrderService {

    async SapOrderList(options: any): Promise<CartOrderProps[]> {
        const { query, skip, limit, sort, getTotalCount } = pagination(options.query || {}, options);
        const { getaddress, getCartProducts, getpaymentmethod, getcustomer } = options;

        const defaultSort = { orderStatusAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        const modifiedPipeline = {
            $lookup: {
                ...cartProductsLookup.$lookup,
                pipeline: [
                    productLookup,
                    { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
                    productVariantsLookupValues("1"),
                    { $unwind: { path: "$productDetails.variantDetails", preserveNullAndEmptyArrays: true } },
                ]
            }
        };
        const pipeline: any[] = [
            ...((!getTotalCount && getCartProducts === '1') ? [modifiedPipeline] : [cartProductsLookup]),
            ...((!getTotalCount && getcustomer === '1') ? [customerLookup] : []),
            ...((!getTotalCount && getpaymentmethod === '1') ? [paymentMethodLookup] : []),
            ...((!getTotalCount && (getcustomer === '1' || getpaymentmethod === '1')) ? [orderListObjectLookup] : []),
            ...((!getTotalCount && getaddress === '1') ? shippingAndBillingLookup('shippingId', 'shippingAddress') : []),
            countriesLookup,
            {
                $unwind: {
                    path: "$country",
                    preserveNullAndEmptyArrays: true
                }
            },
            { $match: query },
            ...((!getTotalCount && getCartProducts === '1') ? [cartDeatilSimpleProject] : [cartProject]),
        ];

        if (!getTotalCount) {
            pipeline.push({ $sort: finalSort });
        }

        if (!getTotalCount && skip) {
            pipeline.push({ $skip: skip });
        }

        if (!getTotalCount && limit) {
            pipeline.push({ $limit: limit });
        }

        const createdCartWithValues = await CartOrderModel.aggregate(pipeline);
        return createdCartWithValues;
    }

}

export default new SapOrderService();
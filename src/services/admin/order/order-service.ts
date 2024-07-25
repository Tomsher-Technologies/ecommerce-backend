import { pagination } from '../../../components/pagination';
import { ADDRESS_MODES } from '../../../constants/customer';
import CartOrderModel, { CartOrderProps } from '../../../model/frontend/cart-order-model';
import { cartDeatilProject, cartProductsLookup, cartProject, couponLookup, customerLookup, orderListObjectLookup, paymentMethodLookup, shippingAndBillingLookup, } from '../../../utils/config/cart-order-config';
import { countriesLookup } from '../../../utils/config/customer-config';
import { productLookup } from '../../../utils/config/product-config';
import { productVariantsLookupValues } from '../../../utils/config/wishlist-config';


class OrderService {

    async OrderList(options: any): Promise<CartOrderProps[]> {
        const { query, skip, limit, sort, getTotalCount } = pagination(options.query || {}, options);
        const { getAddress, getCartProducts } = options;

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
                    // productBrandLookupValues,
                    // { $unwind: { path: "$productDetails.brand", preserveNullAndEmptyArrays: true } },
                    { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
                    productVariantsLookupValues("1"),
                    // attributePipeline,
                    { $unwind: { path: "$productDetails.variantDetails", preserveNullAndEmptyArrays: true } },
                ]
            }
        };
        const pipeline: any[] = [
            ...((!getTotalCount && getCartProducts === '1') ? [modifiedPipeline] : [cartProductsLookup]),
            ...((!getTotalCount && getCartProducts) ? [couponLookup, { $unwind: { path: "$couponDetails", preserveNullAndEmptyArrays: true } }] : []),
            ...(!getTotalCount ? [paymentMethodLookup, customerLookup, orderListObjectLookup] : []),
            ...((!getTotalCount && getAddress === '1') ? shippingAndBillingLookup('shippingId', 'shippingAddress') : []),
            ...((!getTotalCount && getAddress === '1') ? shippingAndBillingLookup('billingId', 'billingAddress') : []),
            countriesLookup,
            {
                $unwind: {
                    path: "$country",
                    preserveNullAndEmptyArrays: true
                }
            },
            { $match: query },
            ...((!getTotalCount && getCartProducts === '1') ? [cartDeatilProject] : [cartProject]),
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

    async orderStatusUpdate(orderId: string, orderData: any, getCartProducts: string = '0'): Promise<CartOrderProps | null> {
        const updatedBrand = await CartOrderModel.findByIdAndUpdate(
            orderId,
            orderData,
            { new: true, useFindAndModify: false }
        );
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
        if (updatedBrand) {
            const pipeline = [
                { $match: { _id: updatedBrand._id } },
                ...(getCartProducts === '1' ? [modifiedPipeline] : [cartProductsLookup]),
                paymentMethodLookup,
                customerLookup,
                orderListObjectLookup,
                ...(getCartProducts === '1' ? [cartDeatilProject] : [cartProject]),
            ];

            const updatedBrandWithValues = await CartOrderModel.aggregate(pipeline);

            return updatedBrandWithValues[0];
        } else {
            return null;
        }
    }

}

export default new OrderService();

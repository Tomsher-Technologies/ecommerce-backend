import { frontendPagination } from '../../../components/pagination';
import CartOrderModel, { CartOrderProps } from '../../../model/frontend/cart-order-model';
import { billingLookup, cartDeatilProject, cartLookup, cartProject, couponLookup, customerLookup, orderListObjectLookup, paymentMethodLookup, shippingAndBillingLookup, } from '../../../utils/config/cart-order-config';
import { productLookup } from '../../../utils/config/product-config';
import { productVariantsLookupValues } from '../../../utils/config/wishlist-config';


class OrderService {

    async OrderList(options: any): Promise<CartOrderProps[]> {

        const { query, skip, limit, sort } = frontendPagination(options.query || {}, options);
        const { getAddress, getCartProducts } = options;

        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        const modifiedPipeline = {
            $lookup: {
                ...cartLookup.$lookup,
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
            ...(getCartProducts === '1' ? [modifiedPipeline] : [cartLookup]),
            ...(getCartProducts ? [couponLookup, { $unwind: { path: "$couponDetails", preserveNullAndEmptyArrays: true } }] : []),
            paymentMethodLookup,
            customerLookup,
            orderListObjectLookup,
            ...(getAddress === '1' ? shippingAndBillingLookup('shippingId', 'shippingAddress') : []),
            ...(getAddress === '1' ? shippingAndBillingLookup('billingId', 'billingAddress') : []),

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
                ...cartLookup.$lookup,
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
                ...(getCartProducts === '1' ? [modifiedPipeline] : [cartLookup]),
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

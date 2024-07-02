import { FilterOptionsProps, frontendPagination, pagination } from '../../../components/pagination';
import CartOrderModel, { CartOrderProps } from '../../../model/frontend/cart-order-model';
import { billingLookup, cartDeatilProject, cartLookup, cartProject, couponLookup, customerLookup, objectLookup, orderListObjectLookup, paymentMethodLookup, pickupStoreLookup, shippingLookup } from '../../../utils/config/cart-order-config';
import { brandLookup, brandObject, productLookup } from '../../../utils/config/product-config';
import { productVariantsLookupValues, wishlistProductCategoryLookup } from '../../../utils/config/wishlist-config';


class OrderService {

    constructor() {

    }
    async OrderList(options: any): Promise<CartOrderProps[]> {

        const { query, skip, limit, sort, hostName } = frontendPagination(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        const pipeline: any[] = [
            cartLookup,
            paymentMethodLookup,
            customerLookup,
            orderListObjectLookup,
            { $match: query },
            { $sort: finalSort },
            cartProject
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

    async orderDetails(options: any): Promise<CartOrderProps[]> {

        const { query, skip, limit, sort, hostName } = frontendPagination(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }


        // productVariantAttributesLookup
        const modifiedPipeline = {
            $lookup: {
                ...cartLookup.$lookup,
                pipeline: [
                    productLookup,
                    // productBrandLookupValues,
                    // { $unwind: { path: "$productDetails.brand", preserveNullAndEmptyArrays: true } },

                    // brandObject,
                    { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
                    productVariantsLookupValues("1"),
                    // attributePipeline,
                    { $unwind: { path: "$productDetails.variantDetails", preserveNullAndEmptyArrays: true } },
                    wishlistProductCategoryLookup,

                ]
            }
        };

        const pipeline: any[] = [
            modifiedPipeline,
            couponLookup,
            shippingLookup,
            billingLookup,
            paymentMethodLookup,
            pickupStoreLookup,
            objectLookup,
            cartDeatilProject,
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

        return createdCartWithValues[0];
        // return CartOrderModel.findOne(data);
    }

}

export default new OrderService();

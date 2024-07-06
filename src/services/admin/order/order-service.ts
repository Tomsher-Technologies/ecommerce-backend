import { frontendPagination } from '../../../components/pagination';
import CartOrderModel, { CartOrderProps } from '../../../model/frontend/cart-order-model';
import { billingLookup, cartLookup, cartProject, customerLookup, orderListObjectLookup, paymentMethodLookup, shippingLookup, } from '../../../utils/config/cart-order-config';


class OrderService {

    constructor() {

    }
    async OrderList(options: any): Promise<CartOrderProps[]> {

        const { query, skip, limit, sort, hostName } = frontendPagination(options.query || {}, options);
        const { getAddress } = options;

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
            // shippingLookup,
            ...(getAddress === '1' ? [shippingLookup] : []),
            ...(getAddress === '1' ? [billingLookup] : []),

            // billingLookup,
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

}

export default new OrderService();

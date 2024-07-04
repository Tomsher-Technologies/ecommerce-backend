import { frontendPagination} from '../../../components/pagination';
import CartOrderModel, { CartOrderProps } from '../../../model/frontend/cart-order-model';
import { cartLookup, cartProject, customerLookup, orderListObjectLookup, paymentMethodLookup,} from '../../../utils/config/cart-order-config';


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

}

export default new OrderService();

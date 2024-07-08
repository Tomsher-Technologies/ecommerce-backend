import { frontendPagination } from '../../../components/pagination';
import CartOrderModel, { CartOrderProps } from '../../../model/frontend/cart-order-model';
import { billingLookup, cartLookup, cartProject, customerLookup, orderListObjectLookup, paymentMethodLookup, shippingAndBillingLookup, } from '../../../utils/config/cart-order-config';


class OrderService {

    constructor() {

    }
    async OrderList(options: any): Promise<CartOrderProps[]> {

        const { query, skip, limit, sort } = frontendPagination(options.query || {}, options);
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
            ...(getAddress === '1' ? shippingAndBillingLookup('shippingId', 'shippingAddress') : []),
            ...(getAddress === '1' ? shippingAndBillingLookup('billingId', 'billingAddress') : []),

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

    async orderStatusUpdate(orderId: string, orderData: any): Promise<CartOrderProps | null> {
        const updatedBrand = await CartOrderModel.findByIdAndUpdate(
            orderId,
            orderData,
            { new: true, useFindAndModify: false }
        );

        if (updatedBrand) {
            const pipeline = [
                { $match: { _id: updatedBrand._id } },
                cartLookup,
                paymentMethodLookup,
                customerLookup,
                orderListObjectLookup,
                cartProject
            ];

            const updatedBrandWithValues = await CartOrderModel.aggregate(pipeline);

            return updatedBrandWithValues[0];
        } else {
            return null;
        }
    }

}

export default new OrderService();

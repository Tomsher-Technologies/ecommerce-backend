import { pagination } from '../../../../components/pagination';
import CartOrderModel, { CartOrderProps } from '../../../../model/frontend/cart-order-model';


class ProductReportService {
    async topSelling(options: any): Promise<any[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);
        const defaultSort = { totalQuantity: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0 || !sortKeys[0]) {
            finalSort = defaultSort;
        }
        const pipeline: any[] = [
            {
                $lookup: {
                    from: 'cartorderproducts',
                    localField: '_id',
                    foreignField: 'cartId',
                    as: 'products'
                }
            },
            {
                $unwind: {
                    path: "$products",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: query
            },
            {
                $group: {
                    _id: "$products.productId",
                    totalQuantity: { $sum: "$products.quantity" }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            {
                $unwind: {
                    path: "$productDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 0,
                    totalQuantity: 1,
                    productDetails: 1
                }
            },
            { $sort: finalSort },
            ...(skip ? [{ $skip: skip }] : []),
            ...(limit ? [{ $limit: limit }] : []),
        ];

        const topSellingProducts = await CartOrderModel.aggregate(pipeline).exec();
        return topSellingProducts;
    }
}

export default new ProductReportService();
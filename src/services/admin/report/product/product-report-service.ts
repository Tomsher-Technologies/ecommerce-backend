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
                    _id: "$products.variantId",
                    totalQuantity: { $sum: "$products.quantity" }
                }
            },
            {
                $lookup: {
                    from: 'productvariants',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'variantDetails'
                }
            },
            {
                $unwind: {
                    path: "$variantDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'variantDetails.productId',
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
                $lookup: {
                    from: 'countries',
                    localField: 'variantDetails.countryId',
                    foreignField: '_id',
                    as: 'variantDetails.countryDetails'
                }
            },
            {
                $unwind: {
                    path: "$variantDetails.countryDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 0,
                    // variantId: "$_id",
                    totalQuantity: 1,
                    variantDetails: "$variantDetails",
                    productDetails: "$productDetails",
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
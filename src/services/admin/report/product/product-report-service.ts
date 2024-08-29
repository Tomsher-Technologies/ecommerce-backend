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
                    localField: "_id",
                    foreignField: "variantId",
                    as: "productDetails"
                }
            },
            { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    variantId: "$_id",
                    totalQuantity: 1,
                    productName: "$productDetails.extraProductTitle",
                    productPrice: "$productDetails.price",
                    discountPrice: "$productDetails.discountPrice",
                    variantSku: "$productDetails.variantSku",
                    variantDescription: "$productDetails.variantDescription",
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
import { FilterOptionsProps, pagination } from '../../../components/pagination';
import CartOrderModel from '../../../model//frontend/cart-order-model';
import { cartProductsLookup } from '../../../utils/config/cart-order-config';
import { productLookup } from '../../../utils/config/product-config';
import { productVariantsLookupValues } from '../../../utils/config/wishlist-config';

class OrderReportService {
    async orderReport(options: FilterOptionsProps = {}): Promise<any | null> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);
        const defaultSort = { createdAt: 1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        const totalOrders = await CartOrderModel.aggregate([
            { $match: query },
            { $skip: skip },
            { $limit: limit },
            {
                $group: {
                    _id: null,
                    totalAmountSum: { $sum: "$totalAmount" },
                    totalProductAmountSum: { $sum: "$totalProductAmount" },
                    totalShippingAmountSum: { $sum: "$totalShippingAmount" },
                    totalDiscountAmountSum: { $sum: "$totalDiscountAmount" },
                    totalCouponAmountSum: { $sum: "$totalCouponAmount" },
                    totalProductOriginalPriceSum: { $sum: "$totalProductOriginalPrice" },
                    totalPaymentMethodChargeSum: { $sum: "$paymentMethodCharge" },
                    totalReturnedProductAmountSum: { $sum: "$totalReturnedProductAmount" },
                    totalGiftWrapAmountSum: { $sum: "$totalGiftWrapAmount" },

                    orders: { $push: "$$ROOT" }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalAmountSum: 1,
                    totalProductAmountSum: 1,
                    totalShippingAmountSum: 1,
                    totalDiscountAmountSum: 1,
                    totalCouponAmountSum: 1,
                    totalProductOriginalPriceSum: 1,
                    totalPaymentMethodChargeSum: 1,
                    totalReturnedProductAmountSum: 1,
                    totalGiftWrapAmountSum: 1,
                    orders: 1
                }
            }
        ]);

        return totalOrders.length > 0 ? totalOrders[0] : null;
    }
}

export default new OrderReportService();

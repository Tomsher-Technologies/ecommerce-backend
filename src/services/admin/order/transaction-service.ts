import { FilterOptionsProps, pagination } from '../../../components/pagination';
import PaymentTransactionModel, { PaymentTransactionModelProps } from '../../../model/frontend/payment-transaction-model';
import { cartOrderLookup, orderPaymentTransactionProject, paymentMethodLookup } from '../../../utils/config/cart-order-config';

class TransactionService {

    constructor() {
    }
    async findAll(options: FilterOptionsProps = {}): Promise<{ total: number; data: PaymentTransactionModelProps[] }> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);

        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        let pipeline: any[] = [
            ...cartOrderLookup,
            { $unwind: { path: "$orders", preserveNullAndEmptyArrays: true } },
            paymentMethodLookup,
            { $unwind: { path: "$paymentMethodId", preserveNullAndEmptyArrays: true } },
            orderPaymentTransactionProject,
            { $match: query },
            {
                $facet: {
                    data: [
                        { $sort: finalSort },
                        { $skip: skip },
                        { $limit: limit },
                    ],
                    total: [{ $count: "count" }]
                }
            },
            {
                $project: {
                    data: 1,
                    total: { $arrayElemAt: ["$total.count", 0] }
                }
            }
        ];

        const result = await PaymentTransactionModel.aggregate(pipeline).exec();
        return {
            total: result[0]?.total || 0,
            data: result[0]?.data || []
        };
    }
}

export default new TransactionService();

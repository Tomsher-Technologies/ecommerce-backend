"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const payment_transaction_model_1 = __importDefault(require("../../../model/frontend/payment-transaction-model"));
const cart_order_config_1 = require("../../../utils/config/cart-order-config");
class TransactionService {
    constructor() {
    }
    async findAll(options = {}) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        let pipeline = [
            ...cart_order_config_1.cartOrderLookup,
            { $unwind: { path: "$orders", preserveNullAndEmptyArrays: true } },
            cart_order_config_1.paymentMethodLookup,
            { $unwind: { path: "$paymentMethodId", preserveNullAndEmptyArrays: true } },
            cart_order_config_1.orderPaymentTransactionProject,
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
        const result = await payment_transaction_model_1.default.aggregate(pipeline).exec();
        return {
            total: result[0]?.total || 0,
            data: result[0]?.data || []
        };
    }
}
exports.default = new TransactionService();

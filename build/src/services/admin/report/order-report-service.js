"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const cart_order_model_1 = __importDefault(require("../../../model//frontend/cart-order-model"));
class OrderReportService {
    async orderReport(options = {}) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        const defaultSort = { createdAt: 1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        const totalOrders = await cart_order_model_1.default.aggregate([
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
exports.default = new OrderReportService();

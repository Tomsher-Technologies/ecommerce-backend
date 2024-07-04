"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const cart_order_model_1 = __importDefault(require("../../../model/frontend/cart-order-model"));
const cart_order_config_1 = require("../../../utils/config/cart-order-config");
class OrderService {
    constructor() {
    }
    async OrderList(options) {
        const { query, skip, limit, sort, hostName } = (0, pagination_1.frontendPagination)(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        const pipeline = [
            cart_order_config_1.cartLookup,
            cart_order_config_1.paymentMethodLookup,
            cart_order_config_1.customerLookup,
            cart_order_config_1.orderListObjectLookup,
            { $match: query },
            { $sort: finalSort },
            cart_order_config_1.cartProject
        ];
        if (skip) {
            pipeline.push({ $skip: skip });
        }
        if (limit) {
            pipeline.push({ $limit: limit });
        }
        const createdCartWithValues = await cart_order_model_1.default.aggregate(pipeline);
        return createdCartWithValues;
    }
}
exports.default = new OrderService();

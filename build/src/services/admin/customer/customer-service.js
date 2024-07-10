"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const pagination_1 = require("../../../components/pagination");
const customers_model_1 = __importDefault(require("../../../model/frontend/customers-model"));
const customer_config_1 = require("../../../utils/config/customer-config");
class CustomerService {
    async findAll(options = {}) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        const pipeline = [
            customer_config_1.whishlistLookup,
            customer_config_1.orderLookup,
            customer_config_1.addField,
            customer_config_1.customerProject,
            { $match: query },
            { $skip: skip },
            { $limit: limit },
            { $sort: finalSort },
        ];
        const createdCartWithValues = await customers_model_1.default.aggregate(pipeline);
        return createdCartWithValues;
    }
    async getTotalCount(query = {}) {
        try {
            const totalCount = await customers_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of customers');
        }
    }
    async findOne(customerId) {
        const pipeline = [
            customer_config_1.countriesLookup,
            customer_config_1.whishlistLookup,
            customer_config_1.orderLookup,
            customer_config_1.addField,
            customer_config_1.billingLookup,
            customer_config_1.shippingLookup,
            customer_config_1.orderWalletTransactionLookup,
            customer_config_1.referredWalletTransactionLookup,
            customer_config_1.referrerWalletTransactionLookup,
            customer_config_1.customerDetailProject,
            { $match: { _id: mongoose_1.default.Types.ObjectId.createFromHexString(customerId) } },
        ];
        const result = await customers_model_1.default.aggregate(pipeline).exec();
        return result?.length > 0 ? result[0] : [];
    }
    async create(customerData) {
        return customers_model_1.default.create(customerData);
    }
}
exports.default = new CustomerService();

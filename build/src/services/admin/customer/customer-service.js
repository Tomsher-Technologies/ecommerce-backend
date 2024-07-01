"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const customers_model_1 = __importDefault(require("../../../model/frontend/customers-model"));
class CustomerService {
    async findAll(options = {}) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        let queryBuilder = customers_model_1.default.find(query)
            .skip(skip)
            .limit(limit)
            .lean();
        if (sort) {
            queryBuilder = queryBuilder.sort(sort);
        }
        return queryBuilder;
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
    async findOne(query, selectData) {
        const queryBuilder = customers_model_1.default.findOne(query);
        if (selectData) {
            queryBuilder.select(selectData);
        }
        return queryBuilder;
    }
}
exports.default = new CustomerService();

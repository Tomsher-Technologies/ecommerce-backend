"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const store_model_1 = __importDefault(require("../../../model/admin/stores/store-model"));
class StoreService {
    async findAll(options = {}) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        let queryBuilder = store_model_1.default.find(query)
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
            const totalCount = await store_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of store');
        }
    }
    async create(storeData) {
        return store_model_1.default.create(storeData);
    }
    async findOne(storeId) {
        return store_model_1.default.findById(storeId);
    }
    async update(storeId, storeData) {
        return store_model_1.default.findByIdAndUpdate(storeId, storeData, { new: true, useFindAndModify: false });
    }
    async destroy(storeId) {
        return store_model_1.default.findOneAndDelete({ _id: storeId });
    }
}
exports.default = new StoreService();

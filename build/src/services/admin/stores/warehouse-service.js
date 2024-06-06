"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const warehouse_model_1 = __importDefault(require("../../../model/admin/stores/warehouse-model"));
class WarehouseService {
    async findAll(options = {}) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        let queryBuilder = warehouse_model_1.default.find(query)
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
            const totalCount = await warehouse_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of warehouses');
        }
    }
    async create(WarehouseData) {
        return warehouse_model_1.default.create(WarehouseData);
    }
    async findOne(warehouseId) {
        return warehouse_model_1.default.findById(warehouseId);
    }
    async update(warehouseId, WarehouseData) {
        return warehouse_model_1.default.findByIdAndUpdate(warehouseId, WarehouseData, { new: true, useFindAndModify: false });
    }
    async destroy(warehouseId) {
        return warehouse_model_1.default.findOneAndDelete({ _id: warehouseId });
    }
}
exports.default = new WarehouseService();

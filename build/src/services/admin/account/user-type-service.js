"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const user_type_model_1 = __importDefault(require("../../../model/admin/account/user-type-model"));
class UserTypeService {
    async findAll(options = {}) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        let queryBuilder = user_type_model_1.default.find(query)
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
            const totalCount = await user_type_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of user types');
        }
    }
    async create(userTypeData) {
        return user_type_model_1.default.create(userTypeData);
    }
    async findOne(userTypeId) {
        return user_type_model_1.default.findById(userTypeId);
    }
    async update(userTypeId, userTypeData) {
        return user_type_model_1.default.findByIdAndUpdate(userTypeId, userTypeData, { new: true, useFindAndModify: false });
    }
    async destroy(userTypeId) {
        return user_type_model_1.default.findOneAndDelete({ _id: userTypeId });
    }
}
exports.default = new UserTypeService();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../../src/components/pagination");
const privilages_model_1 = __importDefault(require("../../../../src/model/admin/account/privilages-model"));
class PrivilagesService {
    async findAll(options = {}) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        let queryBuilder = privilages_model_1.default.find(query)
            .populate({
            path: 'userTypeID',
            match: { _id: { $exists: true } }, // Filter out invalid ObjectId values
            select: 'userTypeName'
        })
            .lean();
        return queryBuilder;
    }
    async getTotalCount(query = {}) {
        try {
            const totalCount = await privilages_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of privilages');
        }
    }
    async create(privilageData) {
        return privilages_model_1.default.create(privilageData);
    }
    async findOne(userTypeId) {
        return privilages_model_1.default.findOne({ userTypeId });
    }
    async update(privilageId, privilageData) {
        return privilages_model_1.default.findByIdAndUpdate(privilageId, privilageData, { new: true, useFindAndModify: false });
    }
}
exports.default = new PrivilagesService();

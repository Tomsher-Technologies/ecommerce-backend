"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const user_model_1 = __importDefault(require("../../../model/admin/account/user-model"));
class UserService {
    async findAll(options = {}) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        let queryBuilder = user_model_1.default.find(query)
            .populate({
            path: 'userTypeID',
            match: { _id: { $exists: true } }, // Filter out invalid ObjectId values
            select: 'userTypeName'
        })
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
            const totalCount = await user_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of users');
        }
    }
    async create(userData) {
        return user_model_1.default.create(userData);
    }
    async findOne(userId) {
        return user_model_1.default.findById(userId).populate({
            path: 'userTypeID',
            match: { _id: { $exists: true } }, // Filter out invalid ObjectId values
            select: 'userTypeName'
        });
    }
    async update(userId, userData) {
        return user_model_1.default.findByIdAndUpdate(userId, userData, { new: true, useFindAndModify: false }).populate({
            path: 'userTypeID',
            match: { _id: { $exists: true } }, // Filter out invalid ObjectId values
            select: 'userTypeName'
        });
    }
    async destroy(userId) {
        return user_model_1.default.findOneAndDelete({ _id: userId });
    }
}
exports.default = new UserService();

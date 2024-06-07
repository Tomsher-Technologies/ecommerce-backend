"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const website_setup_model_1 = __importDefault(require("../../../model/admin/setup/website-setup-model"));
class PagesService {
    async findAll(options = {}) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        let queryBuilder = website_setup_model_1.default.find(query)
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
            const totalCount = await website_setup_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of page');
        }
    }
    async create(pageData) {
        return website_setup_model_1.default.create(pageData);
    }
    async findOne(query) {
        return website_setup_model_1.default.findOne(query);
    }
    async update(pageId, pageData) {
        return website_setup_model_1.default.findByIdAndUpdate(pageId, pageData, { new: true, useFindAndModify: false });
    }
    async destroy(pageId) {
        return website_setup_model_1.default.findOneAndDelete({ _id: pageId });
    }
}
exports.default = new PagesService();

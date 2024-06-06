"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../../src/components/pagination");
const language_model_1 = __importDefault(require("../../../../src/model/admin/setup/language-model"));
class LanguagesService {
    async findAll(options = {}) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        let queryBuilder = language_model_1.default.find(query)
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
            const totalCount = await language_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of languages');
        }
    }
    async create(languageData) {
        return language_model_1.default.create(languageData);
    }
    async findOne(languageId) {
        return language_model_1.default.findById(languageId);
    }
    async update(languageId, languageData) {
        return language_model_1.default.findByIdAndUpdate(languageId, languageData, { new: true, useFindAndModify: false });
    }
    async destroy(languageId) {
        return language_model_1.default.findOneAndDelete({ _id: languageId });
    }
}
exports.default = new LanguagesService();

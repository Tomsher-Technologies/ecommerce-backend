"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const website_setup_model_1 = __importDefault(require("../../../model/admin/setup/website-setup-model"));
class SettingsService {
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
            throw new Error('Error fetching total count of setting');
        }
    }
    async create(settingData) {
        return website_setup_model_1.default.create(settingData);
    }
    async findOne(query) {
        return website_setup_model_1.default.findOne(query);
    }
    async update(settingId, settingData) {
        return website_setup_model_1.default.findByIdAndUpdate(settingId, settingData, { new: true, useFindAndModify: false });
    }
    async destroy(settingId) {
        return website_setup_model_1.default.findOneAndDelete({ _id: settingId });
    }
}
exports.default = new SettingsService();

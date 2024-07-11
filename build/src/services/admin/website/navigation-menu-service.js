"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const website_setup_model_1 = __importDefault(require("../../../model/admin/setup/website-setup-model"));
class NavigationMenuService {
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
            throw new Error('Error fetching total count of menus');
        }
    }
    async create(menuData) {
        return website_setup_model_1.default.create(menuData);
    }
    async findOne(query) {
        return website_setup_model_1.default.findOne(query);
    }
    async update(menuId, menuData) {
        return website_setup_model_1.default.findByIdAndUpdate(menuId, menuData, { new: true, useFindAndModify: false });
    }
    async destroy(menuId) {
        return website_setup_model_1.default.findOneAndDelete({ _id: menuId });
    }
}
exports.default = new NavigationMenuService();

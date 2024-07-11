"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../../src/components/pagination");
const tax_model_1 = __importDefault(require("../../../../src/model/admin/setup/tax-model"));
class TaxService {
    async findAll(options = {}) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        let queryBuilder = tax_model_1.default.find(query)
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
            const totalCount = await tax_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of tax');
        }
    }
    async create(taxData) {
        return tax_model_1.default.create(taxData);
    }
    async findOne(taxId) {
        return tax_model_1.default.findById(taxId);
    }
    async update(taxId, taxData) {
        return tax_model_1.default.findByIdAndUpdate(taxId, taxData, { new: true, useFindAndModify: false });
    }
    async destroy(taxId) {
        return tax_model_1.default.findOneAndDelete({ _id: taxId });
    }
}
exports.default = new TaxService();

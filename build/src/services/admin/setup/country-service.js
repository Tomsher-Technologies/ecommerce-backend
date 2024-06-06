"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const country_model_1 = __importDefault(require("../../../model/admin/setup/country-model"));
class CountryService {
    async findAll(options = {}) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        let queryBuilder = country_model_1.default.find(query)
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
            const totalCount = await country_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of countries');
        }
    }
    async create(countryData) {
        return country_model_1.default.create(countryData);
    }
    async findOne(countryId) {
        return country_model_1.default.findById(countryId);
    }
    async findOneByCountryCode(countryCode) {
        const result = await country_model_1.default.findOne({ countryCode: countryCode });
        return result._id;
    }
    async update(countryId, countryData) {
        return country_model_1.default.findByIdAndUpdate(countryId, countryData, { new: true, useFindAndModify: false });
    }
    async destroy(countryId) {
        return country_model_1.default.findOneAndDelete({ _id: countryId });
    }
    async findCountry(data) {
        return country_model_1.default.findOne(data);
    }
    async findCountryId(data) {
        const resultCountry = await country_model_1.default.findOne(data);
        if (resultCountry) {
            console.log("resultCountry:", resultCountry);
            return resultCountry;
        }
    }
}
exports.default = new CountryService();

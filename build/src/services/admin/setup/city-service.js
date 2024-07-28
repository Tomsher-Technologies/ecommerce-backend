"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const customer_config_1 = require("../../../utils/config/customer-config");
const city_model_1 = __importDefault(require("../../../model/admin/setup/city-model"));
class CityService {
    async findAllCity(options = {}) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        const aggregationPipeline = [
            { $match: query },
            customer_config_1.countriesLookup,
            { $unwind: '$country' },
            customer_config_1.statesLookup,
            { $unwind: '$state' },
            { $skip: skip },
            { $limit: limit },
        ];
        if (sort) {
            aggregationPipeline.push({ $sort: sort });
        }
        return city_model_1.default.aggregate(aggregationPipeline).exec();
    }
    async getCityTotalCount(query = {}) {
        try {
            const totalCount = await city_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of citys');
        }
    }
    async creatCitye(cityData) {
        return city_model_1.default.create(cityData);
    }
    async updateCity(cityId, cityData) {
        return city_model_1.default.findByIdAndUpdate(cityId, cityData, { new: true, useFindAndModify: false });
    }
    async destroyCity(cityId) {
        return city_model_1.default.findOneAndDelete({ _id: cityId });
    }
    async findOneCity(data) {
        return city_model_1.default.findOne(data);
    }
}
exports.default = new CityService();

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
        if (Object.keys(sort).length > 0) {
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
        const createdCity = await city_model_1.default.create(cityData);
        if (createdCity) {
            const pipeline = [
                { $match: { _id: createdCity._id } },
                customer_config_1.countriesLookup,
                { $unwind: '$country' },
                customer_config_1.statesLookup,
                { $unwind: '$state' },
            ];
            const createdCityWithValues = await city_model_1.default.aggregate(pipeline);
            return createdCityWithValues[0];
        }
        else {
            return null;
        }
    }
    async updateCity(cityId, cityData) {
        const updatedBannner = await city_model_1.default.findByIdAndUpdate(cityId, cityData, { new: true, useFindAndModify: false });
        if (updatedBannner) {
            const pipeline = [
                { $match: { _id: updatedBannner._id } },
                customer_config_1.countriesLookup,
                { $unwind: '$country' },
                customer_config_1.statesLookup,
                { $unwind: '$state' },
            ];
            const updatedBannnerWithValues = await city_model_1.default.aggregate(pipeline);
            return updatedBannnerWithValues[0];
        }
        else {
            return null;
        }
    }
    async destroyCity(cityId) {
        return city_model_1.default.findOneAndDelete({ _id: cityId });
    }
    async findOneCity(data) {
        return city_model_1.default.findOne(data);
    }
}
exports.default = new CityService();

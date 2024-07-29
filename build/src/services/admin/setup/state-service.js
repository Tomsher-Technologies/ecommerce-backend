"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const state_model_1 = __importDefault(require("../../../model/admin/setup/state-model"));
const customer_config_1 = require("../../../utils/config/customer-config");
class StateService {
    async findAllState(options = {}) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        const aggregationPipeline = [
            { $match: query },
            customer_config_1.countriesLookup,
            { $unwind: '$country' },
            { $skip: skip },
            { $limit: limit },
        ];
        if (Object.keys(sort).length > 0) {
            aggregationPipeline.push({ $sort: sort });
        }
        return state_model_1.default.aggregate(aggregationPipeline).exec();
    }
    async getStateTotalCount(query = {}) {
        try {
            const totalCount = await state_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of states');
        }
    }
    async creatState(stateData) {
        const createdState = await state_model_1.default.create(stateData);
        if (createdState) {
            const pipeline = [
                { $match: { _id: createdState._id } },
                customer_config_1.countriesLookup,
                { $unwind: '$country' },
            ];
            const createdStateWithValues = await state_model_1.default.aggregate(pipeline);
            return createdStateWithValues[0];
        }
        else {
            return null;
        }
    }
    async updateState(stateId, stateData) {
        const updatedBannner = await state_model_1.default.findByIdAndUpdate(stateId, stateData, { new: true, useFindAndModify: false });
        if (updatedBannner) {
            const pipeline = [
                { $match: { _id: updatedBannner._id } },
                customer_config_1.countriesLookup,
                { $unwind: '$country' },
            ];
            const updatedBannnerWithValues = await state_model_1.default.aggregate(pipeline);
            return updatedBannnerWithValues[0];
        }
        else {
            return null;
        }
    }
    async destroyState(stateId) {
        return state_model_1.default.findOneAndDelete({ _id: stateId });
    }
    async findOneState(data) {
        return state_model_1.default.findOne(data);
    }
}
exports.default = new StateService();

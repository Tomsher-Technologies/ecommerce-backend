"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const pagination_1 = require("../../../components/pagination");
const slider_model_1 = __importDefault(require("../../../model/admin/ecommerce/slider-model"));
const slider_config_1 = require("../../../utils/config/slider-config");
class SliderService {
    constructor() { }
    async findAll(options = {}) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        let pipeline = [
            { $match: query },
            { $skip: skip },
            { $limit: limit },
            { $sort: finalSort },
            slider_config_1.sliderLookup,
            slider_config_1.sliderProject
        ];
        return slider_model_1.default.aggregate(pipeline).exec();
    }
    async getTotalCount(query = {}) {
        try {
            const totalCount = await slider_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of sliders');
        }
    }
    async create(sliderData) {
        const createdSlider = await slider_model_1.default.create(sliderData);
        if (createdSlider) {
            const pipeline = [
                { $match: { _id: createdSlider._id } },
                slider_config_1.sliderLookup,
                slider_config_1.sliderProject
            ];
            const createdSliderWithValues = await slider_model_1.default.aggregate(pipeline);
            return createdSliderWithValues[0];
        }
        else {
            return null;
        }
    }
    async findOne(sliderId) {
        if (sliderId) {
            const objectId = new mongoose_1.default.Types.ObjectId(sliderId);
            const pipeline = [
                { $match: { _id: objectId } },
                slider_config_1.sliderLookup,
                slider_config_1.sliderProject
            ];
            const sliderDataWithValues = await slider_model_1.default.aggregate(pipeline);
            return sliderDataWithValues[0];
        }
        else {
            return null;
        }
    }
    async update(sliderId, sliderData) {
        const updatedSlider = await slider_model_1.default.findByIdAndUpdate(sliderId, sliderData, { new: true, useFindAndModify: false });
        if (updatedSlider) {
            const pipeline = [
                { $match: { _id: updatedSlider._id } },
                slider_config_1.sliderLookup,
                slider_config_1.sliderProject
            ];
            const updatedSliderWithValues = await slider_model_1.default.aggregate(pipeline);
            return updatedSliderWithValues[0];
        }
        else {
            return null;
        }
    }
    async destroy(sliderId) {
        return slider_model_1.default.findOneAndDelete({ _id: sliderId });
    }
}
exports.default = new SliderService();

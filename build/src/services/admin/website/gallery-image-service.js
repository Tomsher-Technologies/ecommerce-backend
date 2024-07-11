"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const pagination_1 = require("../../../components/pagination");
const gallery_image_model_1 = __importDefault(require("../../../model/admin/website/gallery-image-model"));
class GalleryImageService {
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
        ];
        return gallery_image_model_1.default.aggregate(pipeline).exec();
    }
    async getTotalCount(query = {}) {
        try {
            const totalCount = await gallery_image_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of brands');
        }
    }
    async create(data) {
        const created = await gallery_image_model_1.default.create(data);
        if (created) {
            const pipeline = [
                { $match: { _id: created._id } },
            ];
            const createdBrandWithValues = await gallery_image_model_1.default.aggregate(pipeline);
            return createdBrandWithValues[0];
        }
        else {
            return null;
        }
    }
    async findOne(id) {
        if (id) {
            const objectId = new mongoose_1.default.Types.ObjectId(id);
            const pipeline = [
                { $match: { _id: objectId } },
            ];
            const brandDataWithValues = await gallery_image_model_1.default.aggregate(pipeline);
            return brandDataWithValues[0];
        }
        else {
            return null;
        }
    }
    async update(brandId, brandData) {
        const updatedBrand = await gallery_image_model_1.default.findByIdAndUpdate(brandId, brandData, { new: true, useFindAndModify: false });
        if (updatedBrand) {
            const pipeline = [
                { $match: { _id: updatedBrand._id } },
            ];
            const updatedBrandWithValues = await gallery_image_model_1.default.aggregate(pipeline);
            return updatedBrandWithValues[0];
        }
        else {
            return null;
        }
    }
    async destroy(brandId) {
        return gallery_image_model_1.default.findOneAndDelete({ _id: brandId });
    }
}
exports.default = new GalleryImageService();

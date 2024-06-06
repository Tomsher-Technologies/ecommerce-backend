"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const pagination_1 = require("../../../components/pagination");
const brands_model_1 = __importDefault(require("../../../model/admin/ecommerce/brands-model"));
const helpers_1 = require("../../../utils/helpers");
const brand_config_1 = require("../../../utils/config/brand-config");
class BrandsService {
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
            brand_config_1.brandLookup,
        ];
        return brands_model_1.default.aggregate(pipeline).exec();
    }
    async getTotalCount(query = {}) {
        try {
            const totalCount = await brands_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of brands');
        }
    }
    async create(brandData) {
        const createdBrand = await brands_model_1.default.create(brandData);
        if (createdBrand) {
            const pipeline = [
                { $match: { _id: createdBrand._id } },
                brand_config_1.brandLookup,
            ];
            const createdBrandWithValues = await brands_model_1.default.aggregate(pipeline);
            return createdBrandWithValues[0];
        }
        else {
            return null;
        }
    }
    async findOne(brandId) {
        if (brandId) {
            const objectId = new mongoose_1.default.Types.ObjectId(brandId);
            const pipeline = [
                { $match: { _id: objectId } },
                brand_config_1.brandLookup,
            ];
            const brandDataWithValues = await brands_model_1.default.aggregate(pipeline);
            return brandDataWithValues[0];
        }
        else {
            return null;
        }
    }
    async update(brandId, brandData) {
        const updatedBrand = await brands_model_1.default.findByIdAndUpdate(brandId, brandData, { new: true, useFindAndModify: false });
        if (updatedBrand) {
            const pipeline = [
                { $match: { _id: updatedBrand._id } },
                brand_config_1.brandLookup,
            ];
            const updatedBrandWithValues = await brands_model_1.default.aggregate(pipeline);
            return updatedBrandWithValues[0];
        }
        else {
            return null;
        }
    }
    async destroy(brandId) {
        return brands_model_1.default.findOneAndDelete({ _id: brandId });
    }
    async findBrand(data) {
        return brands_model_1.default.findOne(data);
    }
    async findBrandId(brandTitle) {
        const resultBrand = await this.findBrand({ brandTitle: brandTitle });
        if (resultBrand) {
            return resultBrand;
        }
        else {
            const brandData = {
                brandTitle: brandTitle,
                slug: (0, helpers_1.slugify)(brandTitle),
                isExcel: true
            };
            const brandResult = await this.create(brandData);
            if (brandResult) {
                return brandResult;
            }
        }
    }
    async updateWebsitePriority(container1, columnKey) {
        try {
            // Set columnKey to '0' for all documents initially
            await brands_model_1.default.updateMany({ [columnKey]: { $gt: '0' } }, { [columnKey]: '0' });
            if (container1 && container1.length > 0) {
                // Loop through container1 and update [mode] for each corresponding document
                for (let i = 0; i < container1.length; i++) {
                    const brandId = container1[i];
                    const brand = await brands_model_1.default.findById(brandId);
                    if (brand) {
                        brand[columnKey] = (i + 1).toString();
                        await brand.save({ validateBeforeSave: false });
                    }
                }
            }
        }
        catch (error) {
            throw new Error(error + 'Failed to update ' + columnKey);
        }
    }
}
exports.default = new BrandsService();

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
const cart_model_1 = __importDefault(require("../../../model/frontend/cart-model"));
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
    async create(cartData) {
        const createdCart = await cart_model_1.default.create(cartData);
        if (createdCart) {
            const pipeline = [
                { $match: { _id: createdCart._id } },
            ];
            const createdCartWithValues = await cart_model_1.default.aggregate(pipeline);
            return createdCartWithValues[0];
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
        const slug = (0, helpers_1.slugify)(brandTitle);
        const resultBrand = await this.findBrand({ slug: slug });
        if (resultBrand) {
            return resultBrand;
        }
        else {
            const brandData = {
                brandTitle: (0, helpers_1.capitalizeWords)(brandTitle),
                slug: (0, helpers_1.slugify)(brandTitle),
                isExcel: true
            };
            const brandResult = await this.create(brandData);
            if (brandResult) {
                return brandResult;
            }
        }
    }
}
exports.default = new BrandsService();

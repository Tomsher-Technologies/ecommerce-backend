"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const collections_brands_model_1 = __importDefault(require("../../../model/admin/website/collections-brands-model"));
const brands_model_1 = __importDefault(require("../../../model/admin/ecommerce/brands-model"));
const collections_brands_config_1 = require("../../../utils/config/collections-brands-config");
class CollectionsBrandsService {
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
            collections_brands_config_1.collectionsBrandLookup
        ];
        return collections_brands_model_1.default.aggregate(pipeline).exec();
    }
    async findUnCollectionedBrands(brandIds) {
        try {
            const query = { _id: { $nin: brandIds } };
            const unCollectionedBrands = await brands_model_1.default.find(query).select('_id brandTitle slug description brandImageUrl status');
            return unCollectionedBrands;
        }
        catch (error) {
            console.error('Error in findUnCollectionedBrands:', error);
            throw error;
        }
    }
    async findCollectionBrands(brandIds) {
        try {
            const query = { _id: { $in: brandIds } };
            const brands = await brands_model_1.default.find(query).select('_id brandTitle slug description brandImageUrl status');
            const sortedBrands = brandIds.map(id => brands.find(brand => brand._id.toString() === id.toString()));
            return sortedBrands.filter(brand => brand !== undefined);
        }
        catch (error) {
            console.error('Error in findCollectionBrands:', error);
            throw error;
        }
    }
    async getTotalCount(query = {}) {
        try {
            const totalCount = await collections_brands_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of collections brands');
        }
    }
    async create(collectionsBrandData) {
        const createdCollections = await collections_brands_model_1.default.create(collectionsBrandData);
        if (createdCollections) {
            const pipeline = [
                { $match: { _id: createdCollections._id } },
                collections_brands_config_1.collectionsBrandLookup
            ];
            const createdCollectionsWithValues = await collections_brands_model_1.default.aggregate(pipeline);
            return createdCollectionsWithValues[0];
        }
        else {
            return null;
        }
    }
    async findOne(collectionsBrandId) {
        const collectionsBrandData = await collections_brands_model_1.default.findById(collectionsBrandId);
        if (collectionsBrandData) {
            const pipeline = [
                { $match: { _id: collectionsBrandData._id } },
                collections_brands_config_1.collectionsBrandLookup
            ];
            const collectionsBrandDataWithValues = await collections_brands_model_1.default.aggregate(pipeline);
            return collectionsBrandDataWithValues[0];
        }
        else {
            return null;
        }
    }
    async update(collectionsBrandId, collectionsBrandData) {
        const updatedCollectionsBrand = await collections_brands_model_1.default.findByIdAndUpdate(collectionsBrandId, collectionsBrandData, { new: true, useFindAndModify: false });
        if (updatedCollectionsBrand) {
            const pipeline = [
                { $match: { _id: updatedCollectionsBrand._id } },
                collections_brands_config_1.collectionsBrandLookup
            ];
            const updatedCollectionsBrandWithValues = await collections_brands_model_1.default.aggregate(pipeline);
            return updatedCollectionsBrandWithValues[0];
        }
        else {
            return null;
        }
    }
    async destroy(collectionsBrandId) {
        return collections_brands_model_1.default.findOneAndDelete({ _id: collectionsBrandId });
    }
}
exports.default = new CollectionsBrandsService();

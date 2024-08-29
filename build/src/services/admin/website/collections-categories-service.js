"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const collections_categories_model_1 = __importDefault(require("../../../model/admin/website/collections-categories-model"));
const category_model_1 = __importDefault(require("../../../model/admin/ecommerce/category-model"));
const collections_categories_config_1 = require("../../../utils/config/collections-categories-config");
class CollectionsCategoriesService {
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
            collections_categories_config_1.collectionsCategoryLookup,
        ];
        return collections_categories_model_1.default.aggregate(pipeline).exec();
    }
    async findUnCollectionedCategories(categoryIds) {
        try {
            const query = { _id: { $nin: categoryIds } };
            const unCollectionedCategories = await category_model_1.default.find(query).select('_id categoryTitle slug description categoryImageUrl categorySecondImageUrl status');
            return unCollectionedCategories;
        }
        catch (error) {
            console.error('Error in findUnCollectionedCategories:', error);
            throw error;
        }
    }
    async findCollectionCategories(categoryIds) {
        try {
            const query = { _id: { $in: categoryIds } };
            const categories = await category_model_1.default.find(query).select('_id categoryTitle slug description categoryImageUrl categorySecondImageUrl status');
            const sortedCategories = categoryIds.map(id => categories.find(category => category._id.toString() === id.toString()));
            return sortedCategories.filter(category => category !== undefined);
        }
        catch (error) {
            console.error('Error in findCollectionCategories:', error);
            throw error;
        }
    }
    async getTotalCount(query = {}) {
        try {
            const totalCount = await collections_categories_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of collections categories');
        }
    }
    async create(collectionsCategoryData) {
        const createdCollections = await collections_categories_model_1.default.create(collectionsCategoryData);
        if (createdCollections) {
            const pipeline = [
                { $match: { _id: createdCollections._id } },
                collections_categories_config_1.collectionsCategoryLookup,
            ];
            const createdCollectionsWithValues = await collections_categories_model_1.default.aggregate(pipeline);
            return createdCollectionsWithValues[0];
        }
        else {
            return null;
        }
    }
    async findOne(collectionsCategoryId) {
        const collectionsCategoryData = await collections_categories_model_1.default.findById(collectionsCategoryId);
        if (collectionsCategoryData) {
            const pipeline = [
                { $match: { _id: collectionsCategoryData._id } },
                collections_categories_config_1.collectionsCategoryLookup,
            ];
            const collectionsCategoryDataWithValues = await collections_categories_model_1.default.aggregate(pipeline);
            return collectionsCategoryDataWithValues[0];
        }
        else {
            return null;
        }
    }
    async update(collectionsCategoryId, collectionsCategoryData) {
        const updatedCollectionsCategory = await collections_categories_model_1.default.findByIdAndUpdate(collectionsCategoryId, collectionsCategoryData, { new: true, useFindAndModify: false });
        if (updatedCollectionsCategory) {
            const pipeline = [
                { $match: { _id: updatedCollectionsCategory._id } },
                collections_categories_config_1.collectionsCategoryLookup,
            ];
            const updatedCollectionsCategoryWithValues = await collections_categories_model_1.default.aggregate(pipeline);
            return updatedCollectionsCategoryWithValues[0];
        }
        else {
            return null;
        }
    }
    async destroy(collectionsCategoryId) {
        return collections_categories_model_1.default.findOneAndDelete({ _id: collectionsCategoryId });
    }
}
exports.default = new CollectionsCategoriesService();

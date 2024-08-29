"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const collections_product_config_1 = require("../../../utils/config/collections-product-config");
const collections_products_model_1 = __importDefault(require("../../../model/admin/website/collections-products-model"));
const product_model_1 = __importDefault(require("../../../model/admin/ecommerce/product-model"));
class CollectionsProductsService {
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
            collections_product_config_1.collectionsProductLookup,
        ];
        return collections_products_model_1.default.aggregate(pipeline).exec();
    }
    async findUnCollectionedProducts(productIds) {
        try {
            const query = { _id: { $nin: productIds } };
            const unCollectionedProducts = await product_model_1.default.find(query).select('_id productTitle slug description productImageUrl status');
            return unCollectionedProducts;
        }
        catch (error) {
            console.error('Error in findUnCollectionedProducts:', error);
            throw error;
        }
    }
    async findCollectionProducts(productIds) {
        try {
            const query = { _id: { $in: productIds } };
            const products = await product_model_1.default.find(query).select('_id productTitle slug description productImageUrl status');
            const sortedProducts = productIds.map(id => products.find(product => product._id.toString() === id.toString()));
            return sortedProducts.filter(product => product !== undefined);
        }
        catch (error) {
            console.error('Error in findCollectionProducts:', error);
            throw error;
        }
    }
    async getTotalCount(query = {}) {
        try {
            const totalCount = await collections_products_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of collections products');
        }
    }
    async create(collectionsProductData) {
        const createdCollections = await collections_products_model_1.default.create(collectionsProductData);
        if (createdCollections) {
            const pipeline = [
                { $match: { _id: createdCollections._id } },
                collections_product_config_1.collectionsProductLookup,
            ];
            const createdCollectionsWithValues = await collections_products_model_1.default.aggregate(pipeline);
            return createdCollectionsWithValues[0];
        }
        else {
            return null;
        }
    }
    async findOne(collectionsProductId) {
        const collectionsProductData = await collections_products_model_1.default.findById(collectionsProductId);
        if (collectionsProductData) {
            const pipeline = [
                { $match: { _id: collectionsProductData._id } },
                collections_product_config_1.collectionsProductLookup,
            ];
            const collectionsProductDataWithValues = await collections_products_model_1.default.aggregate(pipeline);
            return collectionsProductDataWithValues[0];
        }
        else {
            return null;
        }
    }
    async update(collectionsProductId, collectionsProductData) {
        const updatedCollectionsProduct = await collections_products_model_1.default.findByIdAndUpdate(collectionsProductId, collectionsProductData, { new: true, useFindAndModify: false });
        if (updatedCollectionsProduct) {
            const pipeline = [
                { $match: { _id: updatedCollectionsProduct._id } },
                collections_product_config_1.collectionsProductLookup,
            ];
            const updatedCollectionsProductWithValues = await collections_products_model_1.default.aggregate(pipeline);
            return updatedCollectionsProductWithValues[0];
        }
        else {
            return null;
        }
    }
    async destroy(collectionsProductId) {
        return collections_products_model_1.default.findOneAndDelete({ _id: collectionsProductId });
    }
}
exports.default = new CollectionsProductsService();

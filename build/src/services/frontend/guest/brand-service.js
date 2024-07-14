"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const pagination_1 = require("../../../components/pagination");
const brands_model_1 = __importDefault(require("../../../model/admin/ecommerce/brands-model"));
const language_model_1 = __importDefault(require("../../../model/admin/setup/language-model"));
const brand_config_1 = require("../../../utils/config/brand-config");
const sub_domain_1 = require("../../../utils/frontend/sub-domain");
const product_service_1 = __importDefault(require("./product-service"));
const product_model_1 = __importDefault(require("../../../model/admin/ecommerce/product-model"));
const product_category_link_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-category-link-model"));
class BrandService {
    constructor() { }
    async findAll(options = {}, collectionId) {
        const { query, hostName, } = (0, pagination_1.pagination)(options.query || {}, options);
        let pipeline = [];
        let collectionPipeline = false;
        if (collectionId) {
            collectionPipeline = await product_service_1.default.collection(collectionId, hostName, pipeline);
        }
        if (collectionId && collectionId.collectionproduct && collectionPipeline && collectionPipeline.productIds) {
            const brandIds = await product_model_1.default.find({
                _id: { $in: collectionPipeline.productIds.map((productId) => productId) }
            }).select('brand');
            pipeline = [{
                    $match: {
                        '_id': { $in: brandIds.map((brandId) => brandId.brand) }
                    }
                }];
        }
        if (collectionPipeline && collectionPipeline.categoryIds && collectionPipeline.categoryIds.length > 0) {
            const categoryProductsIds = await product_category_link_model_1.default.find({ categoryId: { $in: collectionPipeline.categoryIds } }).select('productId');
            if (categoryProductsIds && categoryProductsIds.length > 0) {
                const brandIds = await product_model_1.default.find({ _id: { $in: categoryProductsIds.map((categoryProductsId) => categoryProductsId.productId) } }).select('brand');
                pipeline.push({ $match: { '_id': { $in: brandIds.map((brandId) => brandId.brand) } } });
            }
        }
        if (collectionPipeline && collectionPipeline.brandIds && collectionPipeline.brandIds.length > 0) {
            pipeline.push({ $match: { '_id': { $in: collectionPipeline.brandIds.map((id) => new mongoose_1.default.Types.ObjectId(id)) } } });
        }
        pipeline.push({ $match: query });
        const languageData = await language_model_1.default.find().exec();
        const languageId = (0, sub_domain_1.getLanguageValueFromSubdomain)(hostName, languageData);
        if (languageId != null) {
            pipeline = await this.brandLanguage(hostName, pipeline);
        }
        const data = await brands_model_1.default.aggregate(pipeline).exec();
        return data;
    }
    async brandLanguage(hostName, pipeline) {
        const languageData = await language_model_1.default.find().exec();
        const languageId = (0, sub_domain_1.getLanguageValueFromSubdomain)(hostName, languageData);
        if (languageId) {
            const brandLookupWithLanguage = {
                ...brand_config_1.brandLookup,
                $lookup: {
                    ...brand_config_1.brandLookup.$lookup,
                    pipeline: brand_config_1.brandLookup.$lookup.pipeline.map((stage) => {
                        if (stage.$match && stage.$match.$expr) {
                            return {
                                ...stage,
                                $match: {
                                    ...stage.$match,
                                    $expr: {
                                        ...stage.$match.$expr,
                                        $and: [
                                            ...stage.$match.$expr.$and,
                                            { $eq: ['$languageId', languageId] },
                                        ]
                                    }
                                }
                            };
                        }
                        return stage;
                    })
                }
            };
            pipeline.push(brandLookupWithLanguage);
            pipeline.push(brand_config_1.brandLanguageFieldsReplace);
        }
        // pipeline.push(brandProject);
        // pipeline.push(brandFinalProject);
        return pipeline;
    }
}
exports.default = new BrandService();

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
class BrandService {
    constructor() { }
    async findAll(options = {}, products) {
        const { query, hostName, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        let pipeline = [
            { $match: query },
            { $sort: finalSort },
        ];
        if (query._id || query.slug) {
            const language = await this.brandLanguage(hostName, pipeline);
            const data = await brands_model_1.default.aggregate(language).exec();
            return data;
        }
        var productData = [];
        var brandDetail = [];
        const collection = await product_service_1.default.collection(products, hostName);
        if (collection && collection.productData) {
            productData = collection.productData;
        }
        else if (collection && collection.collectionsBrands) {
            for await (let brand of collection.collectionsBrands) {
                pipeline = pipeline.filter(stage => !stage['$match'] || !stage['$match']._id);
                pipeline.push({ '$match': { _id: new mongoose_1.default.Types.ObjectId(brand) } });
                const language = await this.brandLanguage(hostName, pipeline);
                const data = await brands_model_1.default.aggregate(language).exec();
                if (!brandDetail.includes(data[0]._id)) {
                    await brandDetail.push(data[0]);
                }
            }
        }
        else {
            productData = await product_service_1.default.findProductList({ query, getCategory: '1', getBrand: '1' });
        }
        const brandArray = [];
        if (productData) {
            for await (let product of productData) {
                const isPresent = await brandArray.some((objId) => objId.equals(product.brand._id));
                if (!isPresent) {
                    await brandArray.push(product.brand._id);
                }
            }
            for await (let brand of brandArray) {
                const query = { _id: brand };
                let pipeline = [
                    { $match: query },
                ];
                const language = await this.brandLanguage(hostName, pipeline);
                const data = await brands_model_1.default.aggregate(language).exec();
                if (!brandDetail.includes(data[0]._id)) {
                    await brandDetail.push(data[0]);
                }
            }
        }
        return brandDetail;
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
        pipeline.push(brand_config_1.brandProject);
        pipeline.push(brand_config_1.brandFinalProject);
        return pipeline;
    }
}
exports.default = new BrandService();

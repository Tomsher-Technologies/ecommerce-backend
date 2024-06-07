"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const category_model_1 = __importDefault(require("../../../model/admin/ecommerce/category-model"));
const language_model_1 = __importDefault(require("../../../model/admin/setup/language-model"));
const category_config_1 = require("../../../utils/config/category-config");
const sub_domain_1 = require("../../../utils/frontend/sub-domain");
const product_service_1 = __importDefault(require("./product-service"));
class CategoryService {
    constructor() { }
    async findAll(options = {}) {
        const { query, hostName } = (0, pagination_1.pagination)(options.query || {}, options);
        let pipeline = [
            { $match: query },
        ];
        if (query.level == 0) {
            const language = await this.language(hostName, pipeline);
            const data = await category_model_1.default.aggregate(language).exec();
            return data;
        }
        const productData = await product_service_1.default.findProducts(query);
        var categoryDetail = [];
        const categoryArray = [];
        var i = 1;
        if (productData) {
            for await (let product of productData) {
                for await (let category of product.productCategory) {
                    const isPresent = categoryArray.some((objId) => objId.equals(category.category._id));
                    if (!isPresent) {
                        await categoryArray.push(category.category._id);
                    }
                }
            }
            for await (let category of categoryArray) {
                const query = { parentCategory: category };
                let pipeline = [
                    { $match: query },
                ];
                const language = await this.language(hostName, pipeline);
                const data = await category_model_1.default.aggregate(language).exec();
                if (!categoryDetail.includes(data[0]._id)) {
                    await categoryDetail.push(data[0]);
                }
            }
        }
        return categoryDetail;
        // const languageData = await LanguagesModel.find().exec();
        // const languageId = getLanguageValueFromSubdomain(hostName, languageData);
        // if (languageId) {
        //     if (languageId) {
        //         const categoryLookupWithLanguage = {
        //             ...categoryLookup,
        //             $lookup: {
        //                 ...categoryLookup.$lookup,
        //                 pipeline: categoryLookup.$lookup.pipeline.map((stage: any) => {
        //                     if (stage.$match && stage.$match.$expr) {
        //                         return {
        //                             ...stage,
        //                             $match: {
        //                                 ...stage.$match,
        //                                 $expr: {
        //                                     ...stage.$match.$expr,
        //                                     $and: [
        //                                         ...stage.$match.$expr.$and,
        //                                         { $eq: ['$languageId', languageId] },
        //                                     ]
        //                                 }
        //                             }
        //                         };
        //                     }
        //                     return stage;
        //                 })
        //             }
        //         };
        //         pipeline.push(categoryLookupWithLanguage);
        //         pipeline.push(categoryLanguageFieldsReplace);
        //     }
        // }
        // pipeline.push(categoryProject);
        // pipeline.push(categoryFinalProject);
        // return CategoryModel.aggregate(pipeline).exec();
    }
    async language(hostName, pipeline) {
        const languageData = await language_model_1.default.find().exec();
        const languageId = (0, sub_domain_1.getLanguageValueFromSubdomain)(hostName, languageData);
        if (languageId) {
            if (languageId) {
                const categoryLookupWithLanguage = {
                    ...category_config_1.categoryLookup,
                    $lookup: {
                        ...category_config_1.categoryLookup.$lookup,
                        pipeline: category_config_1.categoryLookup.$lookup.pipeline.map((stage) => {
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
                pipeline.push(categoryLookupWithLanguage);
                pipeline.push(category_config_1.categoryLanguageFieldsReplace);
            }
        }
        pipeline.push(category_config_1.categoryProject);
        pipeline.push(category_config_1.categoryFinalProject);
        return pipeline;
    }
}
exports.default = new CategoryService();

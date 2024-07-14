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
class CategoryService {
    async findAll(options = {}) {
        const { query, hostName, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        const matchPipeline = { $match: query };
        let pipeline = [];
        if (query.level == 0) {
            const language = await this.categoryLanguage(hostName, [matchPipeline]);
            const data = await category_model_1.default.aggregate(language).exec();
            return data;
        }
        const data = await category_model_1.default.aggregate([matchPipeline]).exec();
        var categoryArray = [];
        if (data.length > 0) {
            pipeline.push({ '$match': { parentCategory: data[0]._id } });
            const language = await this.categoryLanguage(hostName, pipeline);
            categoryArray = await category_model_1.default.aggregate(language).exec();
        }
        return categoryArray;
    }
    async categoryLanguage(hostName, pipeline) {
        const languageData = await language_model_1.default.find().exec();
        const languageId = (0, sub_domain_1.getLanguageValueFromSubdomain)(hostName, languageData);
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
        pipeline.push(category_config_1.categoryProject);
        pipeline.push(category_config_1.categoryFinalProject);
        return pipeline;
    }
}
exports.default = new CategoryService();

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
    constructor() { }
    async findAll(options = {}) {
        const { query, hostName } = (0, pagination_1.pagination)(options.query || {}, options);
        let pipeline = [
            { $match: query },
        ];
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
        return category_model_1.default.aggregate(pipeline).exec();
    }
}
exports.default = new CategoryService();
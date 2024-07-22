"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const website_setup_1 = require("../../../constants/website-setup");
const language_model_1 = __importDefault(require("../../../model/admin/setup/language-model"));
const website_setup_model_1 = __importDefault(require("../../../model/admin/setup/website-setup-model"));
const pages_config_1 = require("../../../utils/config/pages-config");
const sub_domain_1 = require("../../../utils/frontend/sub-domain");
class PagesService {
    constructor() { }
    async findPagesData(options = {}) {
        const { query, hostName, blockReference } = options;
        let websiteSetupData = [];
        websiteSetupData = await website_setup_model_1.default.findOne(query);
        let pipeline = [
            { $match: query },
        ];
        const languageData = await language_model_1.default.find().exec();
        const languageId = (0, sub_domain_1.getLanguageValueFromSubdomain)(hostName, languageData);
        if (languageId) {
            const pageMultilanguageFieldsLookupWithLanguage = {
                ...pages_config_1.pageMultilanguageFieldsLookup,
                $lookup: {
                    ...pages_config_1.pageMultilanguageFieldsLookup.$lookup,
                    pipeline: pages_config_1.pageMultilanguageFieldsLookup.$lookup.pipeline.map((stage) => {
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
                                            { $eq: ['$source', blockReference] },
                                        ]
                                    }
                                }
                            };
                        }
                        return stage;
                    })
                }
            };
            pipeline.push(pageMultilanguageFieldsLookupWithLanguage);
        }
        if (blockReference === website_setup_1.blockReferences.home) {
            pipeline.push(pages_config_1.pageHomeAddFieldsStage);
        }
        else if (blockReference === website_setup_1.blockReferences.contactUs) {
            pipeline.push(pages_config_1.pageContsctUsAddFieldsStage);
        }
        else if ((blockReference === website_setup_1.blockReferences.termsAndConditions) || (blockReference === website_setup_1.blockReferences.privacyAndPolicy)) {
            pipeline.push(pages_config_1.pageTermsAndPrivacyAddFieldsStage);
        }
        else if (blockReference === website_setup_1.blockReferences.aboutUs) {
            pipeline.push(pages_config_1.pageAboutUsAddFieldsStage);
        }
        else if (blockReference === website_setup_1.blockReferences.contactUs) {
            pipeline.push(pages_config_1.pageContsctUsAddFieldsStage);
        }
        pipeline.push(pages_config_1.pageFinalProject);
        pipeline.push(pages_config_1.replaceRootStage);
        const pageData = await website_setup_model_1.default.aggregate(pipeline).exec();
        return pageData && pageData.length > 0 ? pageData[0] : {};
    }
}
exports.default = new PagesService();

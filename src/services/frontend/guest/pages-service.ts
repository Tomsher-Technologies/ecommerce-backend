import { FilterOptionsProps } from "../../../components/pagination";
import { multiLanguageSources } from "../../../constants/multi-languages";
import { blockReferences } from "../../../constants/website-setup";

import LanguagesModel from "../../../model/admin/setup/language-model";
import WebsiteSetupModel from "../../../model/admin/setup/website-setup-model";
import { pageHomeAddFieldsStage, pageFinalProject, pageMultilanguageFieldsLookup, replaceRootStage, pageContsctUsAddFieldsStage, pageTermsAndPrivacyAddFieldsStage, pageAboutUsAddFieldsStage } from "../../../utils/config/pages-config";
import { getLanguageValueFromSubdomain } from "../../../utils/frontend/sub-domain";


class PagesService {
    constructor() { }

    async findPagesData(options: FilterOptionsProps = {}): Promise<any> {
        const { query, hostName, blockReference } = options;

        let websiteSetupData: any = []

        websiteSetupData = await WebsiteSetupModel.findOne(query);

        let pipeline: any[] = [
            { $match: query },
        ];

        const languageData = await LanguagesModel.find().exec();
        const languageId = getLanguageValueFromSubdomain(hostName, languageData);

        if (languageId) {
            const pageMultilanguageFieldsLookupWithLanguage = {
                ...pageMultilanguageFieldsLookup,
                $lookup: {
                    ...pageMultilanguageFieldsLookup.$lookup,
                    pipeline: pageMultilanguageFieldsLookup.$lookup.pipeline.map((stage: any) => {
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
        if (blockReference === blockReferences.home) {
            pipeline.push(pageHomeAddFieldsStage);
        } else if (blockReference === blockReferences.contactUs) {
            pipeline.push(pageContsctUsAddFieldsStage);
        } else if ((blockReference === blockReferences.termsAndConditions) || (blockReference === blockReferences.privacyAndPolicy)) {
            pipeline.push(pageTermsAndPrivacyAddFieldsStage);
        } else if (blockReference === blockReferences.aboutUs) {
            pipeline.push(pageAboutUsAddFieldsStage);
        } else if (blockReference === blockReferences.contactUs) {
            pipeline.push(pageContsctUsAddFieldsStage);
        }

        pipeline.push(pageFinalProject);
        pipeline.push(replaceRootStage);

        const pageData = await WebsiteSetupModel.aggregate(pipeline).exec();

        return pageData && pageData.length > 0 ? pageData[0] : {}
    }
}

export default new PagesService();
import { FilterOptionsProps, pagination } from '../../../components/pagination';
import { multiLanguageSources } from '../../../constants/multi-languages';

import CategoryModel, { CategoryProps } from '../../../model/admin/ecommerce/category-model';
import LanguagesModel from '../../../model/admin/setup/language-model';
import { categoryProject, categoryLookup, categoryFinalProject, categoryLanguageFieldsReplace } from "../../../utils/config/category-config";
import { getLanguageValueFromSubdomain } from '../../../utils/frontend/sub-domain';


class CategoryService {
    constructor() { }

    async findAll(options: FilterOptionsProps = {}): Promise<CategoryProps[]> {

        const { query, hostName } = pagination(options.query || {}, options);
        let pipeline: any[] = [
            { $match: query },
        ];
        const languageData = await LanguagesModel.find().exec();
        const languageId = getLanguageValueFromSubdomain(hostName, languageData);
        if (languageId) {
            if (languageId) {
                const categoryLookupWithLanguage = {
                    ...categoryLookup,
                    $lookup: {
                        ...categoryLookup.$lookup,
                        pipeline: categoryLookup.$lookup.pipeline.map((stage: any) => {
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

                pipeline.push(categoryLanguageFieldsReplace);
            }
        }

        pipeline.push(categoryProject);

        pipeline.push(categoryFinalProject);

        return CategoryModel.aggregate(pipeline).exec();
    }
}

export default new CategoryService();

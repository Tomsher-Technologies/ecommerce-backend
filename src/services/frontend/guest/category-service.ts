import { FilterOptionsProps, pagination } from '../../../components/pagination';
import { multiLanguageSources } from '../../../constants/multi-languages';

import CategoryModel, { CategoryProps } from '../../../model/admin/ecommerce/category-model';
import LanguagesModel from '../../../model/admin/setup/language-model';
import { categoryProject, categoryLookup, categoryFinalProject } from "../../../utils/config/category-config";
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

                pipeline.push({
                    $addFields: {
                        categoryTitle: {
                            $cond: {
                                if: {
                                    $or: [
                                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.categoryTitle", 0] }, ""] },
                                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.categoryTitle", 0] }, null] },
                                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.categoryTitle", 0] }, "undefined"] }
                                    ]
                                },
                                then: "$categoryTitle",
                                else: { $arrayElemAt: ["$languageValues.languageValues.categoryTitle", 0] }
                            }
                        },
                        description: {
                            $cond: {
                                if: {
                                    $or: [
                                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.description", 0] }, ""] },
                                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.description", 0] }, null] },
                                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.description", 0] }, "undefined"] }
                                    ]
                                },
                                then: "$description",
                                else: { $arrayElemAt: ["$languageValues.languageValues.description", 0] }
                            }
                        },
                        categoryImageUrl: {
                            $cond: {
                                if: {
                                    $or: [
                                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.categoryImageUrl", 0] }, ""] },
                                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.categoryImageUrl", 0] }, null] },
                                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.categoryImageUrl", 0] }, "undefined"] }
                                    ]
                                },
                                then: "$categoryImageUrl",
                                else: { $arrayElemAt: ["$languageValues.languageValues.categoryImageUrl", 0] }
                            },
                        }
                    }
                });
            }
        }

        pipeline.push(categoryProject);

        pipeline.push(categoryFinalProject);

        return CategoryModel.aggregate(pipeline).exec();
    }
}

export default new CategoryService();

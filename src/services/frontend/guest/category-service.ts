import { FilterOptionsProps, pagination } from '../../../components/pagination';

import CategoryModel, { CategoryProps } from '../../../model/admin/ecommerce/category-model';
import LanguagesModel from '../../../model/admin/setup/language-model';
import { categoryProject, categoryLookup, categoryFinalProject, categoryLanguageFieldsReplace } from "../../../utils/config/category-config";
import { getLanguageValueFromSubdomain } from '../../../utils/frontend/sub-domain';


class CategoryService {
    constructor() { }

    async findAll(options: FilterOptionsProps = {}): Promise<CategoryProps[]> {

        const { query, hostName } = pagination(options.query || {}, options);

        const matchPipeline: any = { $match: query };
        let pipeline: any[] = [];

        if (query.level == 0) {
            const language: any = await this.categoryLanguage(hostName, [matchPipeline])
            const data: any = await CategoryModel.aggregate(language).exec();
            return data
        }
        const data: any = await CategoryModel.aggregate([matchPipeline]).exec();

        var categoryArray: any = []
        if (data.length > 0) {

            pipeline.push({ '$match': { parentCategory: data[0]._id } });

            const language: any = await this.categoryLanguage(hostName, pipeline)

            categoryArray = await CategoryModel.aggregate(language).exec();
        }
        return categoryArray
    }

    async categoryLanguage(hostName: any, pipeline: any): Promise<void> {

        const languageData = await LanguagesModel.find().exec();
        const languageId = getLanguageValueFromSubdomain(hostName, languageData);
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
        pipeline.push(categoryProject);

        pipeline.push(categoryFinalProject);

        return pipeline
    }
}

export default new CategoryService();

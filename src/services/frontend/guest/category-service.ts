import { FilterOptionsProps, pagination } from '../../../components/pagination';

import CategoryModel, { CategoryProps } from '../../../model/admin/ecommerce/category-model';
import LanguagesModel from '../../../model/admin/setup/language-model';
import { categoryProject, categoryLookup, categoryFinalProject, categoryLanguageFieldsReplace } from "../../../utils/config/category-config";
import { getLanguageValueFromSubdomain } from '../../../utils/frontend/sub-domain';
import ProductService from './product-service';


class CategoryService {
    constructor() { }

    async findAll(options: FilterOptionsProps = {}): Promise<CategoryProps[]> {

        const { query, hostName } = pagination(options.query || {}, options);
        let pipeline: any[] = [
            { $match: query },
        ];

        if (query.level == 0) {
            const language: any = await this.categoryLanguage(hostName, pipeline)
            const data: any = await CategoryModel.aggregate(language).exec();

            return data
        }

        const productData: any = await ProductService.findProducts(query)
        var categoryDetail: any = []

        const categoryArray: any = []
        var i = 1;

        if (productData) {
            for await (let product of productData) {
                for await (let category of product.productCategory) {
                    const isPresent = categoryArray.some((objId: any) => objId.equals(category.category._id));

                    if (!isPresent) {
                        await categoryArray.push(category.category._id);
                    }
                }
            }

            for await (let category of categoryArray) {
                const query = { parentCategory: category }
                let pipeline: any[] = [
                    { $match: query },
                ];

                const language: any = await this.categoryLanguage(hostName, pipeline)
                const data: any = await CategoryModel.aggregate(language).exec();
                if (!categoryDetail.includes(data[0]._id)) {
                    await categoryDetail.push(data[0])
                }
            }

        }
        return categoryDetail

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
console.log("pipelinepipelinepipeline",pipeline);

        return pipeline
    }
}

export default new CategoryService();

import mongoose from 'mongoose';
import { FilterOptionsProps, pagination } from '../../../components/pagination';

import CategoryModel, { CategoryProps } from '../../../model/admin/ecommerce/category-model';
import LanguagesModel from '../../../model/admin/setup/language-model';
import { categoryProject, categoryLookup, categoryFinalProject, categoryLanguageFieldsReplace } from "../../../utils/config/category-config";
import { getLanguageValueFromSubdomain } from '../../../utils/frontend/sub-domain';

class CategoryService {

    async findAll(options: FilterOptionsProps = {}): Promise<CategoryProps[]> {
        const { query, hostName, sort } = pagination(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
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

    async findOne(category: string, hostName: string | undefined): Promise<CategoryProps | null> {
        try {
            if (!category) return null;
            const pipeline: any[] = [];
            const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
            if (isObjectId) {
                pipeline.push({ $match: { _id: new mongoose.Types.ObjectId(category) } });
            } else {
                pipeline.push({ $match: { slug: category } });
            }
    
            const categoryLanguageLookup: any = await this.categoryLanguage(hostName, pipeline);
            const categoryDetails = await CategoryModel.aggregate(categoryLanguageLookup).exec();
    
            return categoryDetails[0] || null;
        } catch (error) {
            console.error('Error in findOne:', error);
            return null;
        }
    }
}

export default new CategoryService();

import { FilterOptionsProps, pagination } from '../../../../src/components/pagination';

import LanguagesModel, { LanguageProps } from '../../../../src/model/admin/setup/language-model';


class LanguagesService {
    async findAll(options: FilterOptionsProps = {}): Promise<LanguageProps[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);
        let queryBuilder = LanguagesModel.find(query) 
        .skip(skip)
        .limit(limit)
        .lean();

        if (sort) {
            queryBuilder = queryBuilder.sort(sort);
        }

        return queryBuilder;
    }
    async getTotalCount(query: any = {}): Promise<number> {
        try {
            const totalCount = await LanguagesModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of languages');
        }
    }

    async create(languageData: any): Promise<LanguageProps> {
        return LanguagesModel.create(languageData);
    }

    async findOne(languageId: string): Promise<LanguageProps | null> {
        return LanguagesModel.findById(languageId);
    }

    async update(languageId: string, languageData: any): Promise<LanguageProps | null> {
        return LanguagesModel.findByIdAndUpdate(languageId, languageData, { new: true, useFindAndModify: false });
    }

    async destroy(languageId: string): Promise<LanguageProps | null> {
        return LanguagesModel.findOneAndDelete({ _id: languageId });
    }
}

export default new LanguagesService();

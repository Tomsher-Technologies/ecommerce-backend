import { FilterOptionsProps, pagination } from '../../../components/pagination';

import WebsiteSetupModel, { WebsiteSetupProps } from '../../../model/admin/setup/website-setup-model';

class PagesService {
    async findAll(options: FilterOptionsProps = {}): Promise<WebsiteSetupProps  []> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);
        let queryBuilder = WebsiteSetupModel.find(query)
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
            const totalCount = await WebsiteSetupModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of page');
        }
    }

    async create(pageData: any): Promise<WebsiteSetupProps  > {
        return WebsiteSetupModel.create(pageData);
    }

    async findOne(query: any): Promise<WebsiteSetupProps     | null> {
        return WebsiteSetupModel.findOne(query);
    }

    async update(pageId: string, pageData: any): Promise<WebsiteSetupProps   | null> {
        return WebsiteSetupModel.findByIdAndUpdate(pageId, pageData, { new: true, useFindAndModify: false });
    }

    async destroy(pageId: string): Promise<WebsiteSetupProps     | null> {
        return WebsiteSetupModel.findOneAndDelete({ _id: pageId });
    }
}

export default new PagesService();

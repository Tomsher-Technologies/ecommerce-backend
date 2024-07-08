import { FilterOptionsProps, pagination } from '../../../components/pagination';

import WebsiteSetupModel, { WebsiteSetupProps } from '../../../model/admin/setup/website-setup-model';

class SettingsService {
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
            throw new Error('Error fetching total count of setting');
        }
    }

    async create(settingData: any): Promise<WebsiteSetupProps  > {
        return WebsiteSetupModel.create(settingData);
    }

    async findOne(query: any): Promise<WebsiteSetupProps     | null> {
        return WebsiteSetupModel.findOne(query);
    }

    async update(settingId: string, settingData: any): Promise<WebsiteSetupProps   | null> {
        return WebsiteSetupModel.findByIdAndUpdate(settingId, settingData, { new: true, useFindAndModify: false });
    }

    async destroy(settingId: string): Promise<WebsiteSetupProps     | null> {
        return WebsiteSetupModel.findOneAndDelete({ _id: settingId });
    }
}

export default new SettingsService();

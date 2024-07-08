import { Types } from 'mongoose';
import { FilterOptionsProps, pagination } from '../../../components/pagination';

import WebsiteSetupModel, { WebsiteSetupProps } from '../../../model/admin/setup/website-setup-model';

class NavigationMenuService {
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
            throw new Error('Error fetching total count of menus');
        }
    }

    async create(menuData: any): Promise<WebsiteSetupProps  > {
        return WebsiteSetupModel.create(menuData);
    }

    async findOne(query: any): Promise<WebsiteSetupProps     | null> {
        return WebsiteSetupModel.findOne(query);
    }

    async update(menuId: string, menuData: any): Promise<WebsiteSetupProps   | null> {
        return WebsiteSetupModel.findByIdAndUpdate(menuId, menuData, { new: true, useFindAndModify: false });
    }

    async destroy(menuId: string): Promise<WebsiteSetupProps     | null> {
        return WebsiteSetupModel.findOneAndDelete({ _id: menuId });
    }
}

export default new NavigationMenuService();

import { FilterOptionsProps, pagination } from '@components/pagination';

import BannerModel, { BannerProps } from '@model/admin/ecommerce/banner-model';


class BannerService {
    async findAll(options: FilterOptionsProps = {}): Promise<BannerProps[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);
        let queryBuilder = BannerModel.find(query)
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
            const totalCount = await BannerModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of banners');
        }
    }

    async create(bannerData: any): Promise<BannerProps> {
        return BannerModel.create(bannerData);
    }

    async findOne(bannerId: string): Promise<BannerProps | null> {
        return BannerModel.findById(bannerId);
    }

    async update(bannerId: string, bannerData: any): Promise<BannerProps | null> {
        return BannerModel.findByIdAndUpdate(bannerId, bannerData, { new: true, useFindAndModify: false });
    }

    async destroy(bannerId: string): Promise<BannerProps | null> {
        return BannerModel.findOneAndDelete({ _id: bannerId });
    }
}

export default new BannerService();

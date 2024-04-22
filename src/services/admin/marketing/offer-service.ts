import { FilterOptionsProps, pagination } from '@components/pagination';

import OffersModel, { OffersProps } from '@model/admin/marketing/offers-model';


class OfferService {
    async findAll(options: FilterOptionsProps = {}): Promise<OffersProps[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);
        let queryBuilder = OffersModel.find(query)
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
            const totalCount = await OffersModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of offers');
        }
    }

    async create(offerData: any): Promise<OffersProps> {
        return OffersModel.create(offerData);
    }

    async findOne(offerId: string): Promise<OffersProps | null> {
        return OffersModel.findById(offerId);
    }

    async update(offerId: string, offerData: any): Promise<OffersProps | null> {
        return OffersModel.findByIdAndUpdate(offerId, offerData, { new: true, useFindAndModify: false });
    }

    async destroy(offerId: string): Promise<OffersProps | null> {
        return OffersModel.findOneAndDelete({ _id: offerId });
    }
}

export default new OfferService();

import { FilterOptionsProps, pagination } from '../../../components/pagination';

import CountryModel, { CountryProps } from '../../../model/admin/setup/country-model';


class CountryService {
    async findAll(options: FilterOptionsProps = {}): Promise<CountryProps[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);
        let queryBuilder = CountryModel.find(query) 
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
            const totalCount = await CountryModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of countries');
        }
    }

    async create(countryData: any): Promise<CountryProps> {
        return CountryModel.create(countryData);
    }

    async findOne(countryId: string): Promise<CountryProps | null> {
        return CountryModel.findById(countryId);
    }

    async update(countryId: string, countryData: any): Promise<CountryProps | null> {
        return CountryModel.findByIdAndUpdate(countryId, countryData, { new: true, useFindAndModify: false });
    }

    async destroy(countryId: string): Promise<CountryProps | null> {
        return CountryModel.findOneAndDelete({ _id: countryId });
    }
}

export default new CountryService();

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

    async findOneByCountryCode(countryCode: string): Promise<CountryProps | null> {
        const result: any = await CountryModel.findOne({ countryCode: countryCode });
        return result._id
    }

    async update(countryId: string, countryData: any): Promise<CountryProps | null> {
        return CountryModel.findByIdAndUpdate(countryId, countryData, { new: true, useFindAndModify: false });
    }

    async destroy(countryId: string): Promise<CountryProps | null> {
        return CountryModel.findOneAndDelete({ _id: countryId });
    }
    async findCountry(data: any): Promise<CountryProps | null> {
        return CountryModel.findOne(data);
    }
    async findCountryId(data: any): Promise<void | null> {
        const resultCountry: any = await CountryModel.findOne(data);
        if (resultCountry) {
            console.log("resultCountry:",resultCountry);
            
            return resultCountry
        }
    }
}

export default new CountryService();

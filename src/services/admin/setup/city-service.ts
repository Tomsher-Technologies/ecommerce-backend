import { FilterOptionsProps, pagination } from '../../../components/pagination';
import { countriesLookup, statesLookup } from '../../../utils/config/customer-config';

import CityModel, { CityProps } from '../../../model/admin/setup/city-model';


class CityService {
    async findAllCity(options: FilterOptionsProps = {}): Promise<CityProps[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);

        const aggregationPipeline: any[] = [
            { $match: query },
            countriesLookup,
            { $unwind: '$country' },
            statesLookup,
            { $unwind: '$state' },
            { $skip: skip },
            { $limit: limit },
        ];

        if (Object.keys(sort).length > 0) {
            aggregationPipeline.push({ $sort: sort });
        }

        return CityModel.aggregate(aggregationPipeline).exec();
    }

    async getCityTotalCount(query: any = {}): Promise<number> {
        try {
            const totalCount = await CityModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of citys');
        }
    }

    async creatCitye(cityData: any): Promise<CityProps | null> {
        const createdCity = await CityModel.create(cityData);
        if (createdCity) {
            const pipeline = [
                { $match: { _id: createdCity._id } },
                countriesLookup,
                { $unwind: '$country' },
                statesLookup,
                { $unwind: '$state' },
            ];

            const createdCityWithValues = await CityModel.aggregate(pipeline);

            return createdCityWithValues[0];
        } else {
            return null;
        }
    }

    async updateCity(cityId: string, cityData: any): Promise<CityProps | null> {
        const updatedBannner = await CityModel.findByIdAndUpdate(
            cityId,
            cityData,
            { new: true, useFindAndModify: false }
        );
        if (updatedBannner) {
            const pipeline = [
                { $match: { _id: updatedBannner._id } },
                countriesLookup,
                { $unwind: '$country' },
                statesLookup,
                { $unwind: '$state' },
            ];
            const updatedBannnerWithValues = await CityModel.aggregate(pipeline);
            return updatedBannnerWithValues[0];
        } else {
            return null;
        }
    }

    async destroyCity(cityId: string): Promise<CityProps | null> {
        return CityModel.findOneAndDelete({ _id: cityId });
    }
    async findOneCity(data: any): Promise<CityProps | null> {
        return CityModel.findOne(data);
    }

}

export default new CityService();

import { FilterOptionsProps, pagination } from '../../../components/pagination';

import StateModel, { StateProps } from '../../../model/admin/setup/state-model';
import { countriesLookup } from '../../../utils/config/customer-config';


class StateService {
    async findAllState(options: FilterOptionsProps = {}): Promise<StateProps[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);

        const aggregationPipeline: any[] = [
            { $match: query },
            countriesLookup,
            { $unwind: '$country' },
        ];
        if (skip) {
            aggregationPipeline.push({ $skip: skip });
        }
        if (limit) {
            aggregationPipeline.push({ $limit: limit });
        }
        if (Object.keys(sort).length > 0) {
            aggregationPipeline.push({ $sort: sort });
        }
        return StateModel.aggregate(aggregationPipeline).exec();
    }

    async getStateTotalCount(query: any = {}): Promise<number> {
        try {
            const totalCount = await StateModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of states');
        }
    }

    async creatState(stateData: any): Promise<StateProps | null> {
        const createdState = await StateModel.create(stateData);
        if (createdState) {
            const pipeline = [
                { $match: { _id: createdState._id } },
                countriesLookup,
                { $unwind: '$country' },
            ];

            const createdStateWithValues = await StateModel.aggregate(pipeline);

            return createdStateWithValues[0];
        } else {
            return null;
        }
    }

    async updateState(stateId: string, stateData: any): Promise<StateProps | null> {
        const updatedBannner = await StateModel.findByIdAndUpdate(
            stateId,
            stateData,
            { new: true, useFindAndModify: false }
        );
        if (updatedBannner) {
            const pipeline = [
                { $match: { _id: updatedBannner._id } },
                countriesLookup,
                { $unwind: '$country' },
            ];

            const updatedBannnerWithValues = await StateModel.aggregate(pipeline);

            return updatedBannnerWithValues[0];
        } else {
            return null;
        }
    }

    async destroyState(stateId: string): Promise<StateProps | null> {
        return StateModel.findOneAndDelete({ _id: stateId });
    }
    async findOneState(data: any): Promise<StateProps | null> {
        return StateModel.findOne(data);
    }

}

export default new StateService();

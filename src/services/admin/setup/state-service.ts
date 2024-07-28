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
            { $skip: skip },
            { $limit: limit },
        ];

        if (sort) {
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

    async creatStatee(stateData: any): Promise<StateProps> {
        return StateModel.create(stateData);
    }

    async updateState(stateId: string, stateData: any): Promise<StateProps | null> {
        return StateModel.findByIdAndUpdate(stateId, stateData, { new: true, useFindAndModify: false });
    }

    async destroyState(stateId: string): Promise<StateProps | null> {
        return StateModel.findOneAndDelete({ _id: stateId });
    }
    async findOneState(data: any): Promise<StateProps | null> {
        return StateModel.findOne(data);
    }

}

export default new StateService();

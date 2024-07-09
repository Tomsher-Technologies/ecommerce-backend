import { FilterOptionsProps, pagination } from '../../../components/pagination';
import StoreModel, { StoreProps } from '../../../model/admin/stores/store-model';

class StoreService {
    async findAll(options: FilterOptionsProps = {}): Promise<StoreProps[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);
        let queryBuilder = StoreModel.find(query) 
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
            const totalCount = await StoreModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of store');
        }
    }

    async create(storeData: any): Promise<StoreProps> {
        return StoreModel.create(storeData);
    }

    async findOne(storeId: string): Promise<StoreProps | null> {
        return StoreModel.findById(storeId);
    }

    async update(storeId: string, storeData: any): Promise<StoreProps | null> {
        return StoreModel.findByIdAndUpdate(storeId, storeData, { new: true, useFindAndModify: false });
    }

    async destroy(storeId: string): Promise<StoreProps | null> {
        return StoreModel.findOneAndDelete({ _id: storeId });
    }
}

export default new StoreService();

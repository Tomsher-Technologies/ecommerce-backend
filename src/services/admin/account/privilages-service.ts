import { FilterOptionsProps, pagination } from '@components/pagination';
import PrivilagesModel, { PrivilagesProps } from '@model/admin/account/privilages-model';


class PrivilagesService {
    async findAll(options: FilterOptionsProps = {}): Promise<PrivilagesProps[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);
        let queryBuilder = PrivilagesModel.find(query)
            .populate({
                path: 'userTypeID',
                match: { _id: { $exists: true } }, // Filter out invalid ObjectId values
                select: 'userTypeName'
            })
            .lean();
        return queryBuilder;
    }

    async getTotalCount(query: any = {}): Promise<number> {
        try {
            const totalCount = await PrivilagesModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of privilages');
        }
    }

    async create(privilageData: any): Promise<PrivilagesProps> {
        return PrivilagesModel.create(privilageData);
    }

    async findOne(userTypeId: string): Promise<PrivilagesProps | null> {
        return PrivilagesModel.findOne({ userTypeId });
    }


}

export default new PrivilagesService();

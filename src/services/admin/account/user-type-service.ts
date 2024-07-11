import { FilterOptionsProps, pagination } from '../../../components/pagination';

import UserTypeModel, { UserTypeProps } from '../../../model/admin/account/user-type-model';


class UserTypeService {


    async findAll(options: FilterOptionsProps = {}): Promise<UserTypeProps[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);
        let queryBuilder = UserTypeModel.find(query)
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
            const totalCount = await UserTypeModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of user types');
        }
    }

    async create(userTypeData: any): Promise<UserTypeProps> {
        return UserTypeModel.create(userTypeData);
    }

    async findOne(userTypeId: string): Promise<UserTypeProps | null> {
        return UserTypeModel.findById(userTypeId);
    }

    async update(userTypeId: string, userTypeData: any): Promise<UserTypeProps | null> {
        return UserTypeModel.findByIdAndUpdate(userTypeId, userTypeData, { new: true, useFindAndModify: false });
    }

    async destroy(userTypeId: string): Promise<UserTypeProps | null> {
        return UserTypeModel.findOneAndDelete({ _id: userTypeId });
    }
}

export default new UserTypeService();

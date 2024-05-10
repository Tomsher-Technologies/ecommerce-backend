import { FilterOptionsProps, pagination } from '../../../components/pagination';
import UserModel, { UserProps } from '../../../model/admin/account/user-model';


class UserService {
    async findAll(options: FilterOptionsProps = {}): Promise<UserProps[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);
        let queryBuilder = UserModel.find(query)
            .populate({
                path: 'userTypeID',
                match: { _id: { $exists: true } }, // Filter out invalid ObjectId values
                select: 'userTypeName'
            })
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
            const totalCount = await UserModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of users');
        }
    }

    async create(userData: any): Promise<UserProps> {
        return UserModel.create(userData);
    }

    async findOne(userId: string): Promise<UserProps | null> {
        return UserModel.findById(userId).populate({
            path: 'userTypeID',
            match: { _id: { $exists: true } }, // Filter out invalid ObjectId values
            select: 'userTypeName'
        });
    }

    async update(userId: string, userData: any): Promise<UserProps | null> {
        return UserModel.findByIdAndUpdate(userId, userData, { new: true, useFindAndModify: false }).populate({
            path: 'userTypeID',
            match: { _id: { $exists: true } }, // Filter out invalid ObjectId values
            select: 'userTypeName'
        });
    }

    async destroy(userId: string): Promise<UserProps | null> {
        return UserModel.findOneAndDelete({ _id: userId });
    }
}

export default new UserService();

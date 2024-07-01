import { FilterOptionsProps, pagination } from '../../../components/pagination';
import CustomerModel, { CustomrProps } from '../../../model/frontend/customers-model';


class CustomerService {
    async findAll(options: FilterOptionsProps = {}): Promise<CustomrProps[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);
        let queryBuilder = CustomerModel.find(query)
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
            const totalCount = await CustomerModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of customers');
        }
    }



    async findOne(query: any, selectData?: string): Promise<any | null> {
        const queryBuilder = CustomerModel.findOne(query);
        if (selectData) {
            queryBuilder.select(selectData);
        }
        return queryBuilder;
    }


}

export default new CustomerService();

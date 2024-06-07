import { FilterOptionsProps, pagination } from '../../components/pagination';
import CustomerModel, { CustomrProps } from '../../model/frontend/customers-model';


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

    async create(customerData: any): Promise<CustomrProps> {
        return CustomerModel.create(customerData);
    }

    async findOne(query: any): Promise<CustomrProps | null> {
        return CustomerModel.findOne(query);
    }

    async update(customerId: string, customerData: any): Promise<CustomrProps | null> {
        return CustomerModel.findByIdAndUpdate(customerId, customerData, { new: true, useFindAndModify: false });
    }

    async destroy(customerId: string): Promise<CustomrProps | null> {
        return CustomerModel.findOneAndDelete({ _id: customerId });
    }
}

export default new CustomerService();

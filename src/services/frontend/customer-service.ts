import { FilterOptionsProps, pagination } from '../../components/pagination';
import CustomerAddress, { CustomerAddressProps } from '../../model/frontend/customer-address-model';
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

    async generateReferralCode(firstName: string): Promise<string> {
        const namePart = firstName.slice(0, 3).toUpperCase();

        // Initialize the sequence number
        let sequenceNumber = 1;
        let uniqueCodeFound = false;
        let referralCode = '';

        // Loop until a unique referral code is found
        while (!uniqueCodeFound) {
            const sequencePart = sequenceNumber.toString().padStart(4, '0');
            referralCode = `${namePart}${sequencePart}`;

            // Check if this referral code already exists
            const existingCustomer = await CustomerModel.findOne({ referralCode: referralCode }).exec();

            if (!existingCustomer) {
                uniqueCodeFound = true;
            } else {
                sequenceNumber++;
            }
        }

        return referralCode;
    }

    async create(customerData: any): Promise<CustomrProps> {
        return CustomerModel.create(customerData);
    }

    async findOne(query: any, selectData?: string): Promise<any | null> {
        const queryBuilder = CustomerModel.findOne(query);
        if (selectData) {
            queryBuilder.select(selectData);
        }
        return queryBuilder;
    }

    async update(customerId: string, customerData: any): Promise<CustomrProps | null> {
        return CustomerModel.findByIdAndUpdate(customerId, customerData, { new: true, useFindAndModify: false });
    }

    async destroy(customerId: string): Promise<CustomrProps | null> {
        return CustomerModel.findOneAndDelete({ _id: customerId });
    }


    async findCustomerAddressAll(options: FilterOptionsProps = {}): Promise<CustomerAddressProps[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);
        let queryBuilder = CustomerAddress.find(query)

        if (sort) {
            queryBuilder = queryBuilder.sort(sort);
        }

        return queryBuilder;
    }

    async createCustomerAddress(customerAddressData: any): Promise<CustomerAddressProps> {
        return CustomerAddress.create(customerAddressData);
    }


    async updateCustomerAddress(addressId: string, customerAddressData: any): Promise<CustomerAddressProps | null> {
        return CustomerAddress.findByIdAndUpdate(addressId, customerAddressData, { new: true, useFindAndModify: false });
    }

    async destroyCustomerAddress(addressId: string): Promise<CustomerAddressProps | null> {
        return CustomerAddress.findOneAndDelete({ _id: addressId });
    }

}

export default new CustomerService();

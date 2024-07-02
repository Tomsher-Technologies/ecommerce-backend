import mongoose from 'mongoose';
import { FilterOptionsProps, pagination } from '../../../components/pagination';
import CustomerModel, { CustomrProps } from '../../../model/frontend/customers-model';
import { whishlistLookup, customerProject, addField, orderLookup, billingLookup, shippingLookup, customerDetailProject, orderWalletTransactionLookup, referredWalletTransactionLookup, referrerWalletTransactionLookup } from '../../../utils/config/customer-config';


class CustomerService {
    async findAll(options: FilterOptionsProps = {}): Promise<CustomrProps[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);

        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        const pipeline: any[] = [
            whishlistLookup,
            orderLookup,
            addField,
            customerProject,
            { $match: query },
            { $sort: finalSort },
            { $limit: limit },
            { $sort: finalSort },
        ];
        const createdCartWithValues = await CustomerModel.aggregate(pipeline);
        return createdCartWithValues;
    }

    async getTotalCount(query: any = {}): Promise<number> {
        try {
            const totalCount = await CustomerModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of customers');
        }
    }



    async findOne(customerId: string): Promise<any | null> {
        const pipeline = [
            whishlistLookup,
            orderLookup,
            addField,
            billingLookup,
            shippingLookup,
            orderWalletTransactionLookup,
            referredWalletTransactionLookup,
            referrerWalletTransactionLookup,
            customerDetailProject,
            { $match: { _id: mongoose.Types.ObjectId.createFromHexString(customerId) } },

        ];

        const result: any = await CustomerModel.aggregate(pipeline).exec();
        return result
    }


}

export default new CustomerService();

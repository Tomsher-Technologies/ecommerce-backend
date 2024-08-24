import mongoose from 'mongoose';
import { FilterOptionsProps, pagination } from '../../../components/pagination';
import CustomerModel, { CustomrProps } from '../../../model/frontend/customers-model';
import { whishlistLookup, customerProject, addField, orderLookup, billingLookup, shippingLookup, customerDetailProject, orderWalletTransactionLookup, referredWalletTransactionLookup, referrerWalletTransactionLookup, countriesLookup, reportOrderLookup, addressLookup } from '../../../utils/config/customer-config';


class CustomerService {
    async findAll(options: any = {}, isExcel?: any): Promise<CustomrProps[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        const pipeline: any[] = [];

        if (!options?.includeLookups) {
            pipeline.push(whishlistLookup, orderLookup, addField, ...reportOrderLookup, ...(isExcel === '1' ? [addressLookup] : []));
        }

        pipeline.push(
            customerProject,
            { $match: query },
            {
                $facet: {
                    customerData: [
                        { $sort: finalSort },
                        { $skip: skip },
                        { $limit: limit },
                    ],
                    totalCount: [
                        { $count: 'count' }
                    ]
                }
            },
            {
                $project: {
                    customerData: 1,
                    totalCount: { $arrayElemAt: ['$totalCount.count', 0] }
                }
            }
        );

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
            countriesLookup,
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
        return result?.length > 0 ? result[0] : []
    }
    async create(customerData: any): Promise<CustomrProps> {
        return CustomerModel.create(customerData);
    }

}

export default new CustomerService();

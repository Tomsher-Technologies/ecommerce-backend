import { FilterOptionsProps, pagination } from '../../../components/pagination';

import ContactUsModel, { ContactUsProps } from '../../../model/frontend/contact-us-model';
import { customerLookup } from '../../../utils/config/cart-order-config';
import { countriesLookup } from '../../../utils/config/customer-config';

class ContactUsService {

    constructor() { }

    async findAll(options: FilterOptionsProps = {}): Promise<ContactUsProps[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);

        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        let pipeline: any[] = [
            { $match: query },
            countriesLookup,
            customerLookup,
            { $unwind: { path: "$country", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
            { $sort: finalSort },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    phone: 1,
                    subject: 1,
                    message: 1,
                    status: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    __v: 1,
                    "country._id": 1,
                    "country.countryTitle": 1,
                    "country.slug": 1,
                    "country.countryCode": 1,
                    "country.currencyCode": 1,
                    "country.countryShortTitle": 1,
                    "customer": 1,
                }
            }
        ];

        return ContactUsModel.aggregate(pipeline).exec();
    }

    async getTotalCount(query: any = {}): Promise<number> {
        try {
            const totalCount = await ContactUsModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of newsletters');
        }
    }
}

export default new ContactUsService();

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
            { $skip: skip },
            { $limit: limit },
            { $sort: finalSort },
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

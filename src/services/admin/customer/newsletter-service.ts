import mongoose from 'mongoose';
import { FilterOptionsProps, pagination } from '../../../components/pagination';

import NewsletterModel, { NewsletterProps } from '../../../model/frontend/newsletter-model';
import { countriesLookup } from '../../../utils/config/customer-config';
import { customerLookup } from '../../../utils/config/cart-order-config';

class NewsletterService {

    constructor() { }

    async findAll(options: FilterOptionsProps = {}): Promise<NewsletterProps[]> {
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
            { $skip: skip },
            { $limit: limit },
            { $sort: finalSort },
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
                    country: {
                        _id: "$country._id",
                        countryTitle: "$country.countryTitle",
                        slug: "$country.slug",
                        countryCode: "$country.countryCode",
                        currencyCode: "$country.currencyCode",
                        countryShortTitle: "$country.countryShortTitle",
                    },
                    customer: 1
                }
            }
        ];

        return NewsletterModel.aggregate(pipeline).exec();
    }

    async getTotalCount(query: any = {}): Promise<number> {
        try {
            const totalCount = await NewsletterModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of newsletters');
        }
    }
}

export default new NewsletterService();

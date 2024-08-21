import mongoose from 'mongoose';
import { FilterOptionsProps, pagination } from '../../../components/pagination';

import NewsletterModel, { NewsletterProps } from '../../../model/frontend/newsletter-model';

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
            { $skip: skip },
            { $limit: limit },
            { $sort: finalSort },
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

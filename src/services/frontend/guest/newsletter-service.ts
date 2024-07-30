import NewsletterModel, { NewsletterProps } from '../../../model/frontend/newsletter-model';

class NewsletterService {

    async create(newsletterData: any): Promise<NewsletterProps> {
        return NewsletterModel.create(newsletterData);
    }
}

export default new NewsletterService();

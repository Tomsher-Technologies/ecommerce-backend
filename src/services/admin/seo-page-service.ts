import { FilterOptionsProps, pagination } from '../../components/pagination';

import SeoPageModel, { SeoPageProps } from '../../model/admin/seo-page-model';

class SeoPageService {

    private lookup: any;
    private project: any;
    constructor() {

        this.project = {
            $project: {
                _id: 1,
                pageId: 1,
                pageReferenceId: 1,
                page: 1,
                description: 1,
                longDescription: 1,
                metaTitle: 1,
                metaKeywords: 1,
                metaDescription: 1,
                ogTitle: 1,
                ogDescription: 1,
                twitterTitle: 1,
                twitterDescription: 1,
                status: 1,
                createdAt: 1,
            }
        }
    }

    async findAll(options: FilterOptionsProps = {}): Promise<SeoPageProps[]> {
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

            this.project
        ];

        return SeoPageModel.aggregate(pipeline).exec();
    }

    async getTotalCount(query: any = {}): Promise<number> {
        try {
            const totalCount = await SeoPageModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of Seo');
        }
    }

    async create(seoPage: any): Promise<SeoPageProps | null> {
        try {
            if (seoPage) {

                const existingEntries = await SeoPageModel.findOne({
                    pageId: seoPage.pageId,
                    pageReferenceId: seoPage.pageReferenceId,
                    page: seoPage.page,
                });

                let seoValue: any = {};
                if (existingEntries) {

                    const filter = {
                        pageId: seoPage.pageId,
                        pageReferenceId: seoPage.pageReferenceId,
                        page: seoPage.page,
                    };
                    const update = {
                        $set: {
                            pageId: seoPage.pageId,
                            pageReferenceId: seoPage.pageReferenceId,
                            page: seoPage.page,
                            metaTitle: seoPage.metaTitle,
                            metaKeywords: seoPage.metaKeywords,
                            metaDescription: seoPage.metaDescription,
                            ogTitle: seoPage.ogTitle,
                            ogDescription: seoPage.ogDescription,
                            twitterTitle: seoPage.twitterTitle,
                            twitterDescription: seoPage.twitterDescription,
                            createdAt: new Date()
                        }
                    };

                    const options = {
                        upsert: false,
                        new: true
                    };

                    seoValue = await SeoPageModel.findOneAndUpdate(filter, update, options);
                    return seoValue

                } else {


                    const isEmptyValue = Object.values(seoPage).some(value => (value !== ''));

                    if (isEmptyValue) {

                        const seoPageData = {

                            pageId: seoPage.pageId,
                            pageReferenceId: seoPage.pageReferenceId,
                            page: seoPage.page,
                            metaTitle: seoPage?.metaTitle,
                            metaKeywords: seoPage?.metaKeywords,
                            metaDescription: seoPage?.metaDescription,
                            ogTitle: seoPage?.ogTitle,
                            ogDescription: seoPage?.ogDescription,
                            twitterTitle: seoPage?.twitterTitle,
                            twitterDescription: seoPage?.twitterDescription,
                            createdAt: new Date()
                        };

                        seoValue = await SeoPageModel.create(seoPageData);
                    }
                    return seoValue 


                }
            } else {
                return null
            }
        } catch {
            return null
        }
    }
    async find(pageId: string): Promise<SeoPageProps[]> {

        return SeoPageModel.find({ pageId: pageId })
    }

    async findOne(seoPageId: string): Promise<SeoPageProps | null> {
        if (seoPageId) {
            const pipeline = [
                { $match: { _id: seoPageId } },
                this.lookup,
                this.project
            ];

            const seoPageDataWithValues = await SeoPageModel.aggregate(pipeline);

            return seoPageDataWithValues[0];
        } else {
            return null;
        }
    }

    async update(seoPageId: string, seoPageData: any): Promise<SeoPageProps | null> {
        const updatedSeoPage = await SeoPageModel.findByIdAndUpdate(
            seoPageId,
            seoPageData,
            { new: true, useFindAndModify: false }
        );

        if (updatedSeoPage) {
            const pipeline = [
                { $match: { _id: updatedSeoPage._id } },
                this.lookup,
                this.project
            ];

            const updatedSeoPageWithValues = await SeoPageModel.aggregate(pipeline);

            return updatedSeoPageWithValues[0];
        } else {
            return null;
        }
    }

    async destroy(seoPageId: string): Promise<SeoPageProps | null> {
        return SeoPageModel.findOneAndDelete({ _id: seoPageId });
    }
    async seoPageService(pageId: string | null, seoDetails: any, page: string, pageReferenceId: string): Promise<SeoPageProps[]> {
        try {
            console.log("seoDetails:", seoDetails, pageId);

            if (pageId) {
                if (seoDetails) {
                    if (seoDetails._id != '') {
                        await SeoPageModel.findByIdAndUpdate(seoDetails._id, { ...seoDetails, pageId: pageId });
                    }
                    else {
                        console.log("seoDetailsseoDetailsseoDetails:", seoDetails);

                        await this.create({
                            metaTitle: seoDetails.metaTitle,
                            metaKeywords: seoDetails.metaKeywords,
                            metaDescription: seoDetails.metaDescription,
                            ogTitle: seoDetails.ogTitle,
                            ogDescription: seoDetails.ogDescription,
                            twitterTitle: seoDetails.twitterTitle,
                            twitterDescription: seoDetails.twitterDescription,
                            pageReferenceId: pageReferenceId,
                            pageId: pageId,
                            page: page
                        });

                    }
                }
            }
            return await SeoPageModel.find({ pageId: pageId });
        } catch (error) {
            console.error('Error in seo service:', error);
            throw error;
        }
    }
}

export default new SeoPageService();

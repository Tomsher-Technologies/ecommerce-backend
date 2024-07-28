"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../components/pagination");
const seo_page_model_1 = __importDefault(require("../../model/admin/seo-page-model"));
class SeoPageService {
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
        };
    }
    async findAll(options = {}) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        let pipeline = [
            { $match: query },
            { $skip: skip },
            { $limit: limit },
            { $sort: finalSort },
            this.project
        ];
        return seo_page_model_1.default.aggregate(pipeline).exec();
    }
    async getTotalCount(query = {}) {
        try {
            const totalCount = await seo_page_model_1.default.countDocuments(query);
            return totalCount;
        }
        catch (error) {
            throw new Error('Error fetching total count of Seo');
        }
    }
    async create(seoPage) {
        try {
            if (seoPage) {
                const existingEntries = await seo_page_model_1.default.findOne({
                    pageId: seoPage.pageId,
                    pageReferenceId: seoPage.pageReferenceId,
                    page: seoPage.page,
                });
                let seoValue = {};
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
                    seoValue = await seo_page_model_1.default.findOneAndUpdate(filter, update, options);
                    return seoValue;
                }
                else {
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
                        seoValue = await seo_page_model_1.default.create(seoPageData);
                    }
                    return seoValue;
                }
            }
            else {
                return null;
            }
        }
        catch {
            return null;
        }
    }
    async find(pageId) {
        return seo_page_model_1.default.find({ pageId: pageId });
    }
    async findOne(seoPageId) {
        if (seoPageId) {
            const pipeline = [
                { $match: { _id: seoPageId } },
                this.lookup,
                this.project
            ];
            const seoPageDataWithValues = await seo_page_model_1.default.aggregate(pipeline);
            return seoPageDataWithValues[0];
        }
        else {
            return null;
        }
    }
    async insertOrUpdateSeoDataWithCountryId(pageId, seoData, page) {
        for (const seo of seoData) {
            const { countryId, ...fields } = seo;
            if (Object.values(fields).some(field => field !== '')) {
                await seo_page_model_1.default.findOneAndUpdate({
                    page: page,
                    pageReferenceId: countryId,
                    pageId: pageId,
                }, {
                    ...fields,
                    updatedAt: new Date()
                }, { upsert: true, new: true });
            }
        }
    }
    async update(seoPageId, seoPageData) {
        const updatedSeoPage = await seo_page_model_1.default.findByIdAndUpdate(seoPageId, seoPageData, { new: true, useFindAndModify: false });
        if (updatedSeoPage) {
            const pipeline = [
                { $match: { _id: updatedSeoPage._id } },
                this.lookup,
                this.project
            ];
            const updatedSeoPageWithValues = await seo_page_model_1.default.aggregate(pipeline);
            return updatedSeoPageWithValues[0];
        }
        else {
            return null;
        }
    }
    async destroy(seoPageId) {
        return seo_page_model_1.default.findOneAndDelete({ _id: seoPageId });
    }
    async seoPageService(pageId, seoDetails, page, pageReferenceId) {
        try {
            if (pageId) {
                if (seoDetails) {
                    if (seoDetails._id != '') {
                        await seo_page_model_1.default.findByIdAndUpdate(seoDetails._id, { ...seoDetails, pageId: pageId });
                    }
                    else {
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
            return await seo_page_model_1.default.find({ pageId: pageId });
        }
        catch (error) {
            console.error('Error in seo service:', error);
            throw error;
        }
    }
}
exports.default = new SeoPageService();

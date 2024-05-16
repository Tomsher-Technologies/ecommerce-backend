import { FilterOptionsProps, pagination } from '../../../../components/pagination';

import ProductSeoModel, { ProductSeoProps } from '../../../../model/admin/ecommerce/product/product-seo-model';

class ProductSeoervice {

    private lookup: any;
    private project: any;
    constructor() {

        this.project = {
            $project: {
                _id: 1,
                productId: 1,
                variantId: 1,
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

    async findAll(options: FilterOptionsProps = {}): Promise<ProductSeoProps[]> {
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

        return ProductSeoModel.aggregate(pipeline).exec();
    }

    async getTotalCount(query: any = {}): Promise<number> {
        try {
            const totalCount = await ProductSeoModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of productSeo');
        }
    }

    async create(productSeo: any): Promise<ProductSeoProps | null> {
        try {
            if (productSeo) {

                const existingEntries = await ProductSeoModel.findOne({
                    productId: productSeo.productId,
                    variantId: productSeo.variantId,
                });

                let seoValue: any = {};
                if (existingEntries) {

                    const filter = {
                        productId: productSeo.productId,
                        variantId: productSeo.variantId,

                    };
                    const update = {
                        $set: {
                            productId: productSeo.productId,
                            variantId: productSeo.variantId,
                            description: productSeo.description,
                            longDescription: productSeo.longDescription,
                            metaTitle: productSeo.metaTitle,
                            metaKeywords: productSeo.metaKeywords,
                            metaDescription: productSeo.metaDescription,
                            ogTitle: productSeo.ogTitle,
                            ogDescription: productSeo.ogDescription,
                            twitterTitle: productSeo.twitterTitle,
                            twitterDescription: productSeo.twitterDescription,
                            createdAt: new Date()
                        }
                    };

                    const options = {
                        upsert: false,
                        new: true
                    };

                    seoValue = await ProductSeoModel.findOneAndUpdate(filter, update, options);
                    return seoValue

                } else {


                    const isEmptyValue = Object.values(productSeo).some(value => (value !== ''));

                    if (isEmptyValue) {

                        const productSeoData = {

                            productId: productSeo.productId,
                            variantId: productSeo.variantId,
                            description: productSeo?.description,
                            longDescription: productSeo?.longDescription,
                            metaTitle: productSeo?.metaTitle,
                            metaKeywords: productSeo?.metaKeywords,
                            metaDescription: productSeo?.metaDescription,
                            ogTitle: productSeo?.ogTitle,
                            ogDescription: productSeo?.ogDescription,
                            twitterTitle: productSeo?.twitterTitle,
                            twitterDescription: productSeo?.twitterDescription,
                            createdAt: new Date()
                        };

                        seoValue = await ProductSeoModel.create(productSeoData);
                    }
                    return { ...seoValue }


                }
            } else {
                return null
            }
        } catch {
            return null
        }
    }
    async find(productId: string): Promise<ProductSeoProps[]> {

        return ProductSeoModel.find({ productId: productId })
    }

    async findOne(productSeoId: string): Promise<ProductSeoProps | null> {
        if (productSeoId) {
            const pipeline = [
                { $match: { _id: productSeoId } },
                this.lookup,
                this.project
            ];

            const productSeoDataWithValues = await ProductSeoModel.aggregate(pipeline);

            return productSeoDataWithValues[0];
        } else {
            return null;
        }
    }

    async update(productSeoId: string, productSeoData: any): Promise<ProductSeoProps | null> {
        const updatedproductSeo = await ProductSeoModel.findByIdAndUpdate(
            productSeoId,
            productSeoData,
            { new: true, useFindAndModify: false }
        );

        if (updatedproductSeo) {
            const pipeline = [
                { $match: { _id: updatedproductSeo._id } },
                this.lookup,
                this.project
            ];

            const updatedproductSeoWithValues = await ProductSeoModel.aggregate(pipeline);

            return updatedproductSeoWithValues[0];
        } else {
            return null;
        }
    }

    async destroy(productSeoId: string): Promise<ProductSeoProps | null> {
        return ProductSeoModel.findOneAndDelete({ _id: productSeoId });
    }
    async productSeoService(productId: string | null, seoDetails: any): Promise<ProductSeoProps[]> {
        try {
            if (productId) {
                const existingEntries = await ProductSeoModel.find({ productId: productId });
                if (existingEntries) {
                    const seoIDsToRemove = existingEntries
                        .filter(entry => !seoDetails?.some((data: any) => data?._id?.toString() === entry._id.toString()))
                        .map(entry => entry._id);

                    await ProductSeoModel.deleteMany({ productId: productId, _id: { $in: seoIDsToRemove } });
                }
                if (seoDetails) {
                    const productSeoPromises = await Promise.all(seoDetails.map(async (data: any) => {
                        const existingEntry = await ProductSeoModel.findOne({ _id: data._id });
                        if (existingEntry) {
                            // Update existing document
                            await ProductSeoModel.findByIdAndUpdate(existingEntry._id, { ...data, productId: productId });

                        } else {
                            // Create new document
                            await ProductSeoModel.create({ ...data, productId: productId });
                        }
                    }));

                    await Promise.all(productSeoPromises);
                }
                return await ProductSeoModel.find({ productId: productId });
            } else {
                throw 'Could not find product seo Id';
            }

        } catch (error) {
            console.error('Error in Product seo service:', error);
            throw error;
        }
    }
}

export default new ProductSeoervice();

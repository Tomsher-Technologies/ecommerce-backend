import { FilterOptionsProps, pagination } from '../../../../components/pagination';

import ProductCategoryLinkModel, { ProductCategoryLinkProps } from '../../../../model/admin/ecommerce/product/product-category-link-model';
import mongoose from 'mongoose';


class ProductCategoryLinkService {
    private productCategoryLinkAddFields: any;
    private lookup: any;
    private categoriesLookup: any;
    private productsLookup: any;

    constructor() {
        // this.productCategoryLinkAddFields = {
        //     $addFields:
        // };

        this.lookup = {
            $lookup: {
                from: "brands",
                let: { productCategoryLinkApplyValues: '$productCategoryLinkApplyValues' },
                pipeline: [
                    { $match: { $expr: { $in: [{ $toString: "$_id" }, "$$productCategoryLinkApplyValues"] } } },
                    {
                        $project: {
                            _id: 1,
                            brandTitle: 1,
                            slug: 1,
                            brandImageUrl: 1,
                            status: 1
                        }
                    }
                ],
                as: 'appliedValuesForBrand'
            }
        };

        this.categoriesLookup = {
            $lookup: {
                from: "categories",
                let: { productCategoryLinkApplyValues: '$productCategoryLinkApplyValues' },
                pipeline: [
                    { $match: { $expr: { $in: [{ $toString: "$_id" }, "$$productCategoryLinkApplyValues"] } } },
                    {
                        $project: {
                            _id: 1,
                            categoryTitle: 1,
                            slug: 1,
                            categoryImageUrl: 1,
                            status: 1
                        }
                    }
                ],
                as: 'appliedValuesForCategory'
            }
        };

        this.productsLookup = {
            $lookup: {
                from: "products",
                let: { productCategoryLinkApplyValues: '$productCategoryLinkApplyValues' },
                pipeline: [
                    { $match: { $expr: { $in: [{ $toString: "$_id" }, "$$productCategoryLinkApplyValues"] } } },
                ],
                as: 'appliedValuesForProduct'
            }
        };

    }

    async findAll(options: FilterOptionsProps = {}): Promise<ProductCategoryLinkProps[]> {
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

            this.productCategoryLinkAddFields
        ];

        pipeline.push(
            this.lookup,
            this.categoriesLookup,
            this.productsLookup

        );




        return ProductCategoryLinkModel.aggregate(pipeline).exec();
    }



    async getTotalCount(query: any = {}): Promise<number> {
        try {
            const totalCount = await ProductCategoryLinkModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of productCategoryLinks');
        }
    }

    async find(productId: string, categoryId: string, id: string): Promise<ProductCategoryLinkProps[]> {

        const linkData = await ProductCategoryLinkModel.find({
            $and: [
                { _id: id },
                { productId: productId },
                { categoryId: categoryId },
            ]
        })
        return linkData


        // return ProductCategoryLinkModel.find({productId:productId,categoryId:categoryId});
    }
    async findWithProductId(productId: string): Promise<ProductCategoryLinkProps[]> {

        const linkData = await ProductCategoryLinkModel.find({ productId: productId })
        return linkData


        // return ProductCategoryLinkModel.find({productId:productId,categoryId:categoryId});
    }
    async create(productCategoryLinkData: any): Promise<ProductCategoryLinkProps> {

        return ProductCategoryLinkModel.create(productCategoryLinkData);
    }

    async findOne(productCategoryLinkId: string): Promise<ProductCategoryLinkProps | null> {
        const pipeline = [
            { $match: { _id: mongoose.Types.ObjectId.createFromHexString(productCategoryLinkId) } },

        ];

        const result = await ProductCategoryLinkModel.aggregate(pipeline).exec();
        return result.length > 0 ? result[0] : null;
    }

    async update(productCategoryLinkId: string, productCategoryLinkData: any): Promise<ProductCategoryLinkProps | null> {
        return ProductCategoryLinkModel.findByIdAndUpdate(productCategoryLinkId, productCategoryLinkData, { new: true, useFindAndModify: false });
    }

    async destroy(productCategoryLinkId: string): Promise<ProductCategoryLinkProps | null> {
        return ProductCategoryLinkModel.findOneAndDelete({ _id: productCategoryLinkId });
    }

    async categoryLinkService(productId: string | null, productCategoryDetails: any): Promise<ProductCategoryLinkProps[]> {
        try {
            if (productId) {

                const existingEntries = await ProductCategoryLinkModel.find({ productId: productId });
                if (existingEntries) {

                    const productCategoryIDsToRemove = existingEntries
                        .filter(entry => !productCategoryDetails?.some((data: any) => data?._id?.toString() === entry._id.toString()))
                        .map(entry => entry._id);
                    await ProductCategoryLinkModel.deleteMany({ productId: productId, _id: { $in: productCategoryIDsToRemove } });
                }
                // console.log("existingEntry", productCategoryDetails);
                if (productCategoryDetails) {

                    const categoryLinkPromises = await Promise.all(productCategoryDetails.map(async (data: any) => {

                        const existingEntry = await ProductCategoryLinkModel.findOne({ _id: data._id });

                        if (existingEntry) {
                            // Update existing document
                            await ProductCategoryLinkModel.findByIdAndUpdate(existingEntry._id, { ...data, productId: productId });
                        } else {
                            // Create new document
                            await ProductCategoryLinkModel.create({ ...data, productId: productId });
                        }
                    }));


                    await Promise.all(categoryLinkPromises);
                }

                return await ProductCategoryLinkModel.find({ productId: productId });
            } else {
                throw 'Could not find product Id';
            }

        } catch (error) {
            throw error;
        }
    }
}

export default new ProductCategoryLinkService();

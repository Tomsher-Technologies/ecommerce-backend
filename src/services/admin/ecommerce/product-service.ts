import { FilterOptionsProps, pagination } from '../../../components/pagination';

import { ProductsProps } from '../../../utils/types/products';

import ProductsModel from '../../../model/admin/ecommerce/product-model';
import ProductGalleryImagesModel, { ProductGalleryImagesProps } from '../../../model/admin/ecommerce/product/product-gallery-images-model';
import InventryPricingModel, { InventryPricingProps } from '../../../model/admin/ecommerce/inventry-pricing-model';
import mongoose from 'mongoose';
import { brandLookup, brandObject, imageLookup, productCategoryLookup, productSeoObject, specificationsLookup, variantLookup } from '../../../utils/config/product-config';
import { seoLookup } from '../../../utils/config/common-config';
import { multiLanguageSources } from '../../../constants/multi-languages';
import { collections } from '../../../constants/collections';

class ProductsService {
    private multilanguageFieldsLookup: any;

    constructor() {
        this.multilanguageFieldsLookup = {
            $lookup: {
                from: 'multilanguagefieleds', // Ensure 'from' field is included
                let: { productId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$sourceId', '$$productId'] },
                                    { $eq: ['$source', multiLanguageSources.ecommerce.products] },
                                ],
                            },
                        },
                    },
                ],
                as: 'languageValues',
            },
        };
    }
    async findAll(options: FilterOptionsProps = {}): Promise<ProductsProps[]> {

        const { query, skip, limit, sort } = pagination(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        let pipeline: any[] = [
            productCategoryLookup,
            {
                $lookup: {
                    from: `${collections.ecommerce.products.productvariants.productvariants}`,
                    localField: '_id',
                    foreignField: 'productId',
                    as: 'productVariants',
                },
            },
            brandLookup,
            brandObject,
            this.multilanguageFieldsLookup,
            { $match: query },
            { $skip: skip },
            { $limit: limit },
            { $sort: finalSort },
        ];

        return ProductsModel.aggregate(pipeline).exec();
    }

    async getTotalCount(query: any = {}): Promise<number> {
        try {
            let pipeline: any[] = [
                productCategoryLookup,
                {
                    $lookup: {
                        from: `${collections.ecommerce.products.productvariants.productvariants}`,
                        localField: '_id',
                        foreignField: 'productId',
                        as: 'productVariants',
                    },
                },
                brandLookup,
                brandObject,

                this.multilanguageFieldsLookup,
                { $match: query },
                {
                    $count: 'count'
                }
            ];
            const data: any = await ProductsModel.aggregate(pipeline).exec();
            if (data.length > 0) {
                return data[0].count;

            }
            return 0;
        } catch (error) {
            throw new Error('Error fetching total count of products');
        }
    }

    async find(productData: any): Promise<ProductsProps | null> {
        return ProductsModel.findOne(productData);
    }

    async create(productData: any): Promise<ProductsProps | null> {
        return ProductsModel.create(productData);
    }

    async findOne(productId: string): Promise<ProductsProps | null> {
        try {
            if (productId) {
                const objectId = new mongoose.Types.ObjectId(productId);

                const pipeline = [
                    { $match: { _id: objectId } },
                    productCategoryLookup,
                    variantLookup,
                    imageLookup,
                    brandLookup,
                    brandObject,
                    seoLookup('productSeo'),
                    productSeoObject,
                    this.multilanguageFieldsLookup,
                    specificationsLookup
                ];

                const productDataWithValues = await ProductsModel.aggregate(pipeline);

                return productDataWithValues[0] || null;
            } else {
                return null;
            }
        } catch (error) {
            return null;
        }

    }

    async update(productId: string, productData: any): Promise<ProductsProps | null> {
        return ProductsModel.findByIdAndUpdate(productId, productData, { new: true, useFindAndModify: false });
    }

    async destroy(productId: string): Promise<ProductsProps | null> {
        return ProductsModel.findOneAndDelete({ _id: productId });
    }

    async findGalleryImagesByProductId(_id?: string, productId?: string): Promise<ProductGalleryImagesProps[]> {
        let query: any = {};
        if (_id) {
            query._id = _id;
        }
        if (productId) {
            query.productID = productId;
        }
        return ProductGalleryImagesModel.find(query).select('_id productID galleryImageUrl');
    }

    async createGalleryImages(gallaryImageData: any): Promise<ProductGalleryImagesProps> {
        return ProductGalleryImagesModel.create(gallaryImageData);
    }





    async destroyGalleryImages(gallaryImageID: string): Promise<ProductsProps | null> {
        return ProductGalleryImagesModel.findOneAndDelete({ _id: gallaryImageID });
    }

    async findInventryPricingByProductId(_id?: string, productId?: string): Promise<InventryPricingProps[]> {
        let query: any = {};
        if (_id) {
            query._id = _id;
        }
        if (productId) {
            query.productId = productId;
        }
        return await InventryPricingModel.find(query);
    }

    async inventryDetailsService(productId: string, inventryDetails: any): Promise<InventryPricingProps[]> {
        try {
            const existingEntries = await InventryPricingModel.find({ productId: productId });

            const inventryPricingPromises = await Promise.all(inventryDetails.map(async (data: any) => {
                const existingEntry = existingEntries.find(entry => entry.countryID.toString() === data.countryID.toString());
                if (existingEntry) {
                    await InventryPricingModel.updateOne({ _id: existingEntry._id }, { ...data, productId: productId });
                } else {
                    await InventryPricingModel.create({ ...data, productId: productId });
                }
            }));

            await Promise.all(inventryPricingPromises);

            const countryIDsToRemove = existingEntries
                .filter(entry => !inventryDetails.some((data: any) => data.countryID.toString() === entry.countryID.toString()))
                .map(entry => entry.countryID);
            await InventryPricingModel.deleteMany({ productId: productId, countryID: { $in: countryIDsToRemove } });

            return await InventryPricingModel.find({ productId: productId });
        } catch (error) {
            console.error('Error in inventryDetailsService:', error);
            throw error;
        }
    }

    async updateWebsitePriority(container1: any[] | undefined, columnKey: keyof ProductsProps): Promise<void> {
        try {
            // Set columnKey to '0' for all documents initially
            await ProductsModel.updateMany({ [columnKey]: { $gt: '0' } }, { [columnKey]: '0' });

            if (container1 && container1.length > 0) {
                // Loop through container1 and update [mode] for each corresponding document
                for (let i = 0; i < container1.length; i++) {
                    const productId = container1[i];
                    const product = await ProductsModel.findById(productId);
                    if (product) {
                        (product as any)[columnKey] = (i + 1).toString();
                        await product.save({ validateBeforeSave: false });
                    }
                }
            }
        } catch (error) {
            throw new Error(error + 'Failed to update ' + columnKey);
        }
    }
    async checkRequiredColumns(worksheet: any, requiredColumns: any) {


        for (let column of requiredColumns) {

            if (!worksheet.includes(column)) {

                return column;
            }
        }
    }
}

export default new ProductsService();

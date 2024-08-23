import mongoose from 'mongoose';
import { FilterOptionsProps, pagination } from '../../../components/pagination';

import { ProductsProps } from '../../../utils/types/products';

import ProductsModel from '../../../model/admin/ecommerce/product-model';
import ProductGalleryImagesModel, { ProductGalleryImagesProps } from '../../../model/admin/ecommerce/product/product-gallery-images-model';
import { brandLookup, brandObject, imageLookup, productCategoryLookup, productSeoObject, productSpecificationsLookup, specificationsLookup, variantLookup } from '../../../utils/config/product-config';
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

    async exportProducts(options: FilterOptionsProps = {}): Promise<ProductsProps[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        const pipeline = [
            productCategoryLookup,
            variantLookup,
            imageLookup,
            brandLookup,
            brandObject,
            seoLookup('productSeo'),
            productSeoObject,
            this.multilanguageFieldsLookup,
            productSpecificationsLookup,
            { $match: query },
            { $skip: skip },
            { $limit: limit },
            { $sort: finalSort },
        ];
        const productDataWithValues = await ProductsModel.aggregate(pipeline);

        return productDataWithValues;
    }

}

export default new ProductsService();

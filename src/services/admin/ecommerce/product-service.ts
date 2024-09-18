import mongoose from 'mongoose';
import { FilterOptionsProps, pagination } from '../../../components/pagination';

import { ProductsProps } from '../../../utils/types/products';

import ProductsModel from '../../../model/admin/ecommerce/product-model';
import ProductGalleryImagesModel, { ProductGalleryImagesProps } from '../../../model/admin/ecommerce/product/product-gallery-images-model';
import { addFieldsProductSeo, addFieldsProductSpecification, addFieldsProductVariantAttributes, brandLookup, brandLookupVariant, brandObject, imageLookup, imageLookupVariantWise, productCategoryLookup, productCategoryLookupVariantWise, productLookup, productSeoLookup, productSeoObject, productSpecificationAdminLookup, productSpecificationsLookup, productVariantAttributesAdminLookup, specificationsLookup, variantImageGalleryLookup, variantLookup } from '../../../utils/config/product-config';
import { seoLookup } from '../../../utils/config/common-config';
import { multiLanguageSources } from '../../../constants/multi-languages';
import { collections } from '../../../constants/collections';
import { countriesLookup } from '../../../utils/config/customer-config';
import ProductVariantsModel from '../../../model/admin/ecommerce/product/product-variants-model';

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

        const variantLookupMatch: any = {
            $expr: {
                $eq: ['$countryId', new mongoose.Types.ObjectId(query['productVariants.countryId'])]
            },
            status: "1"
        };
        // const hasProductVariantsFilter = Object.keys(query).some(key => key.includes('productVariants'));
        let pipeline: any[] = [
            productCategoryLookup,
            {
                $lookup: {
                    from: `${collections.ecommerce.products.productvariants.productvariants}`,
                    localField: '_id',
                    foreignField: 'productId',
                    as: 'productVariants',
                    pipeline: [
                        ...(query['productVariants.countryId'] ? [{ $match: variantLookupMatch }] : [])
                    ]
                }
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
        const variantLookupMatch: any = {
            $expr: {
                $eq: ['$countryId', new mongoose.Types.ObjectId(query['productVariants.countryId'])]
            },
            status: "1"
        };
        const pipeline = [
            productCategoryLookup,
            {
                $lookup: {
                    from: `${collections.ecommerce.products.productvariants.productvariants}`,
                    localField: '_id',
                    foreignField: 'productId',
                    as: 'productVariants',
                    pipeline: [
                        ...(query['productVariants.countryId'] ? [{ $match: variantLookupMatch }] : []),
                        ...productVariantAttributesAdminLookup,
                        addFieldsProductVariantAttributes,
                        ...productSpecificationAdminLookup,
                        addFieldsProductSpecification,
                        productSeoLookup,
                        addFieldsProductSeo,
                        variantImageGalleryLookup,
                        countriesLookup
                    ]
                },
            },
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

    async variantProductList(options: any = {}): Promise<any | null> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);
        const { getCategory, getBrand, getAttribute, getSpecification, getCountry, getProductGalleryImage, getGalleryImage, isCount = 0 } = options

        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        let pipeline: any[] = [
            {
                $match: query,
            },
            { $sort: finalSort },
            productLookup,
            { $unwind: "$productDetails" },
        ]
        if (getCountry === '1') {
            pipeline.push(countriesLookup, { $unwind: '$country' });
        }
        if (getCategory === '1') {
            pipeline.push(...productCategoryLookupVariantWise);
        }
        if (getBrand === '1') {
            pipeline.push(...brandLookupVariant);
        }
        if (getAttribute === '1') {
            pipeline.push(...productVariantAttributesAdminLookup, addFieldsProductVariantAttributes);
        }
        if (getSpecification === '1') {
            pipeline.push(...productSpecificationAdminLookup, addFieldsProductSpecification);
        }

        if (getProductGalleryImage === '1') {
            pipeline.push(imageLookupVariantWise);
        }

        if (getGalleryImage === '1') {
            pipeline.push(variantImageGalleryLookup);
        }

        // pipeline.push(
        //     {
        //         $project: {
        //             _id: 1,
        //             productId: 1,
        //             countryId: 1,
        //             variantSku: 1,
        //             extraProductTitle: 1,
        //             price: 1,
        //             discountPrice: 1,
        //             quantity: 1,
        //             cartMinQuantity: 1,
        //             cartMaxQuantity: 1,
        //             hsn: 1,
        //             mpn: 1,
        //             barcode: 1,
        //             isExcel: 1,
        //             isDefault: 1,
        //             status: 1,
        //             productDetails: 1,
        //             country: 1,
        //             productVariantAttributes: 1,
        //             productSpecification: 1,
        //             variantImageGallery: 1,
        //         }
        //     });

        const dataPipeline: any[] = [{ $match: {} }];

        if (skip) {
            dataPipeline.push({ $skip: skip });
        }

        if (limit) {
            dataPipeline.push({ $limit: limit });
        }


        pipeline.push({
            $facet: {
                data: dataPipeline,
                ...(isCount === 1 ? { totalCount: [{ $count: "totalCount" }] } : {}),
            },
        },
            (isCount === 1 ? {
                $project: {
                    data: 1,
                    totalCount: { $arrayElemAt: ["$totalCount.totalCount", 0] }
                }
            } :
                {
                    $project: {
                        data: 1,
                    }
                })
        )
        // pipeline.push(productLookup)
        const outOfStockSKUs = await ProductVariantsModel.aggregate(pipeline);

        const products = outOfStockSKUs[0].data;
        if (isCount == 1) {
            const totalCount = outOfStockSKUs[0].totalCount;
            return { products, totalCount }
        } else {
            return products
        }
    }
}

export default new ProductsService();

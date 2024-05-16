import { FilterOptionsProps, pagination } from '../../../components/pagination';

import { ProductsProps } from '../../../utils/types/products';

import ProductsModel from '../../../model/admin/ecommerce/product-model';
import ProductGalleryImagesModel, { ProductGalleryImagesProps } from '../../../model/admin/ecommerce/product/product-gallery-images-model';
import InventryPricingModel, { InventryPricingProps } from '../../../model/admin/ecommerce/inventry-pricing-model';
import { multiLanguageSources } from '../../../constants/multi-languages';
import mongoose from 'mongoose';

class ProductsService {
    private variantLookup: any;
    private categoryLookup: any;
    private imageLookup: any;

    private multilanguageFieldsLookup: any;
    private project: any;
    
    constructor() {


        this.variantLookup = {
            $lookup: {
                from: 'productvariants',
                localField: '_id',
                foreignField: 'productId',
                as: 'productVariants',
                pipeline: [
                    {
                        $lookup: {
                            from: 'productvariantattributes',
                            localField: '_id',
                            foreignField: 'variantId',
                            as: 'productVariantAttributes',
                        },
                    },
                    {
                        $lookup: {
                            from: 'productspecifications',
                            localField: '_id',
                            foreignField: 'variantId',
                            as: 'productSpecification',
                        },
                    },
                    {
                        $lookup: {
                            from: 'productseos',
                            localField: '_id',
                            foreignField: 'variantId',
                            as: 'productSeo',
                        },
                    },
                    {
                        $lookup: {
                            from: 'productgallaryimages',
                            localField: '_id',
                            foreignField: 'variantId',
                            as: 'variantImageGallery',
                        },
                    }
                ],
            }
        };
        this.categoryLookup = {
            $lookup: {
                from: 'productcategorylinks',
                localField: '_id',
                foreignField: 'productId',
                as: 'category',

            }
        };
        this.imageLookup = {
            $lookup: {
                from: 'productgallaryimages',
                localField: '_id',
                foreignField: 'productID',
                as: 'imageGallery',

            }
        };
        this.multilanguageFieldsLookup = {
            $lookup: {
                from: 'multilanguagefieleds', // Ensure 'from' field is included
                let: { categoryId: '$_id' },
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

        this.project = {
            newRoot: {
                $mergeObjects: ["$$ROOT", {
                    appliedValues: {
                        $concatArrays: ["$category", "$variants"]
                    }
                }]
            }
        }
    }
    async findAll(options: FilterOptionsProps = {}): Promise<ProductsProps[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);
        let queryBuilder = ProductsModel.find(query)
            .populate('category', 'categoryTitle') // Populate category details
            .populate('brand', 'brandTitle') // Populate brand details
            .skip(skip)
            .limit(limit)
            .lean();

        if (sort) {
            queryBuilder = queryBuilder.sort(sort);
        }

        return queryBuilder;
    }

    async getTotalCount(query: any = {}): Promise<number> {
        try {
            const totalCount = await ProductsModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of products');
        }
    }

    async create(productData: any): Promise<ProductsProps> {
        return ProductsModel.create(productData);
    }

    async findOne(productId: string): Promise<ProductsProps | null> {
        try {
            if (productId) {
                const objectId = new mongoose.Types.ObjectId(productId);
                // console.log("objectId:",objectId);

                const pipeline = [
                    { $match: { _id: objectId } },
                    { $replaceRoot: this.project },
                    // this.multilanguageFieldsLookup,
                    this.categoryLookup,
                    this.variantLookup,
                    this.imageLookup,

                    // this.project
                ];

                const productDataWithValues = await ProductsModel.aggregate(pipeline);
// console.log("productDataWithValues:",productDataWithValues);

                return productDataWithValues[0] || null;
            } else {
                return null;
            }
        } catch (error) {
            return null;
        }
        
        return ProductsModel.findById(productId);
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
}

export default new ProductsService();

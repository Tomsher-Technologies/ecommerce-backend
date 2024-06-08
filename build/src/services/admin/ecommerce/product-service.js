"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const product_model_1 = __importDefault(require("../../../model/admin/ecommerce/product-model"));
const product_gallery_images_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-gallery-images-model"));
const inventry_pricing_model_1 = __importDefault(require("../../../model/admin/ecommerce/inventry-pricing-model"));
const multi_languages_1 = require("../../../constants/multi-languages");
const mongoose_1 = __importDefault(require("mongoose"));
const collections_1 = require("../../../constants/collections");
class ProductsService {
    constructor() {
        this.variantLookup = {
            $lookup: {
                from: `${collections_1.collections.ecommerce.products.productvariants.productvariants}`,
                localField: '_id',
                foreignField: 'productId',
                as: 'productVariants',
                pipeline: [
                    {
                        $lookup: {
                            from: `${collections_1.collections.ecommerce.products.productvariants.productvariantattributes}`,
                            localField: '_id',
                            foreignField: 'variantId',
                            as: 'productVariantAttributes',
                            pipeline: [
                                {
                                    $lookup: {
                                        from: `${collections_1.collections.ecommerce.attributedetails}`,
                                        localField: 'attributeDetailId',
                                        foreignField: '_id',
                                        as: 'attributeDetail'
                                    }
                                },
                                {
                                    $unwind: "$attributeDetail"
                                },
                                {
                                    $lookup: {
                                        from: `${collections_1.collections.ecommerce.attributes}`,
                                        localField: 'attributeId',
                                        foreignField: '_id',
                                        as: 'attribute'
                                    }
                                },
                                {
                                    $unwind: "$attribute"
                                },
                                {
                                    $project: {
                                        _id: 1,
                                        variantId: 1,
                                        productId: 1,
                                        attribute: '$attribute',
                                        attributeDetail: '$attributeDetail',
                                    }
                                },
                            ]
                        },
                    },
                    {
                        $addFields: {
                            productVariantAttributes: {
                                $map: {
                                    input: '$productVariantAttributes',
                                    in: {
                                        variantId: '$$this.variantId',
                                        _id: '$$this._id',
                                        attributeId: '$$this.attribute._id',
                                        attributeTitle: '$$this.attribute.attributeTitle',
                                        slug: '$$this.attribute.slug',
                                        attributeType: '$$this.attribute.attributeType',
                                        attributeDetail: {
                                            _id: '$$this.attributeDetail._id',
                                            attributeId: '$$this.attributeDetail.attributeId',
                                            itemName: '$$this.attributeDetail.itemName',
                                            itemValue: '$$this.attributeDetail.itemValue'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: `${collections_1.collections.ecommerce.products.productvariants.productspecifications}`,
                            localField: '_id',
                            foreignField: 'variantId',
                            as: 'productSpecification',
                            pipeline: [
                                {
                                    $lookup: {
                                        from: `${collections_1.collections.ecommerce.specifications}`,
                                        localField: 'specificationId',
                                        foreignField: '_id',
                                        as: 'specification',
                                    },
                                },
                                {
                                    $unwind: "$specification"
                                },
                                {
                                    $lookup: {
                                        from: `${collections_1.collections.ecommerce.specificationdetails}`,
                                        localField: 'specificationDetailId',
                                        foreignField: '_id',
                                        as: 'specificationDetail',
                                    },
                                },
                                {
                                    $unwind: "$specificationDetail"
                                },
                                {
                                    $project: {
                                        _id: 1,
                                        variantId: 1,
                                        productId: 1,
                                        specification: '$specification',
                                        specificationDetail: '$specificationDetail',
                                    }
                                },
                            ]
                        },
                    },
                    {
                        $addFields: {
                            productSpecification: {
                                $map: {
                                    input: '$productSpecification',
                                    in: {
                                        variantId: '$$this.variantId',
                                        _id: '$$this._id',
                                        specificationId: '$$this.specification._id',
                                        specificationTitle: '$$this.specification.specificationTitle',
                                        slug: '$$this.specification.slug',
                                        specificationDetail: {
                                            _id: '$$this.specificationDetail._id',
                                            specificationId: '$$this.specificationDetail.specificationId',
                                            itemName: '$$this.specificationDetail.itemName',
                                            itemValue: '$$this.specificationDetail.itemValue'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: `${collections_1.collections.ecommerce.seopages}`,
                            localField: '_id',
                            foreignField: 'pageReferenceId',
                            as: 'productSeo',
                        },
                    },
                    {
                        $addFields: {
                            productSeo: { $arrayElemAt: ['$productSeo', 0] }
                        }
                    },
                    {
                        $lookup: {
                            from: `${collections_1.collections.ecommerce.products.productgallaryimages}`,
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
                from: `${collections_1.collections.ecommerce.products.productcategorylinks}`,
                localField: '_id',
                foreignField: 'productId',
                as: 'productCategory',
                pipeline: [{
                        $lookup: {
                            from: `${collections_1.collections.ecommerce.categories}`,
                            localField: 'categoryId',
                            foreignField: '_id',
                            as: 'category',
                        },
                    },
                    {
                        $unwind: "$category"
                    },
                    {
                        $project: {
                            _id: 1,
                            productId: 1,
                            category: {
                                _id: 1,
                                categoryTitle: 1,
                                slug: 1,
                                parentCategory: 1,
                                level: 1,
                                categoryImageUrl: 1,
                                status: 1,
                            }
                        }
                    }]
            }
        };
        this.seoLookup = {
            $lookup: {
                from: `${collections_1.collections.ecommerce.seopages}`,
                let: { productId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$pageId', '$$productId'] },
                            'pageReferenceId': null
                        }
                    }
                ],
                as: 'productSeo',
            },
        };
        this.seoObject = {
            $addFields: {
                productSeo: { $arrayElemAt: ['$productSeo', 0] }
            }
        };
        this.specificationLookup = {
            $lookup: {
                from: `${collections_1.collections.ecommerce.products.productvariants.productspecifications}`,
                let: { productId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$productId', '$$productId'] },
                            'variantId': null
                        }
                    }
                ],
                as: 'productSpecification',
            },
        };
        this.brandLookup = {
            $lookup: {
                from: `${collections_1.collections.ecommerce.brands}`,
                localField: 'brand',
                foreignField: '_id',
                as: 'brand',
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            brandTitle: 1,
                            slug: 1,
                            brandImageUrl: 1,
                            status: 1,
                        }
                    },
                ],
            },
        };
        this.brandObject = {
            $addFields: {
                brand: { $arrayElemAt: ['$brand', 0] }
            }
        };
        this.imageLookup = {
            $lookup: {
                from: collections_1.collections.ecommerce.products.productgallaryimages,
                localField: '_id',
                foreignField: 'productID',
                as: 'imageGallery',
            }
        };
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
                                    { $eq: ['$source', multi_languages_1.multiLanguageSources.ecommerce.products] },
                                ],
                            },
                        },
                    },
                ],
                as: 'languageValues',
            },
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
            this.categoryLookup,
            this.variantLookup,
            this.imageLookup,
            this.brandLookup,
            this.brandObject,
            this.seoLookup,
            this.seoObject,
            this.multilanguageFieldsLookup,
            this.specificationLookup,
            { $match: query },
            { $skip: skip },
            { $limit: limit },
            { $sort: finalSort },
        ];
        return product_model_1.default.aggregate(pipeline).exec();
    }
    async getTotalCount(query = {}) {
        try {
            let pipeline = [
                this.categoryLookup,
                this.variantLookup,
                this.imageLookup,
                this.brandLookup,
                this.brandObject,
                this.seoLookup,
                this.seoObject,
                this.multilanguageFieldsLookup,
                this.specificationLookup,
                { $match: query },
                {
                    $count: 'count'
                }
            ];
            const data = await product_model_1.default.aggregate(pipeline).exec();
            // const totalCount = await ProductsModel.countDocuments(query);
            // console.log(totalCount);
            if (data.length > 0) {
                return data[0].count;
            }
            return 0;
        }
        catch (error) {
            throw new Error('Error fetching total count of products');
        }
    }
    async find(productData) {
        return product_model_1.default.findOne(productData);
    }
    async create(productData) {
        const data = product_model_1.default.create(productData);
        if (data) {
            return data;
        }
        else {
            return null;
        }
    }
    async findOne(productId) {
        try {
            if (productId) {
                const objectId = new mongoose_1.default.Types.ObjectId(productId);
                const pipeline = [
                    { $match: { _id: objectId } },
                    this.categoryLookup,
                    this.variantLookup,
                    this.imageLookup,
                    this.brandLookup,
                    this.brandObject,
                    this.seoLookup,
                    this.seoObject,
                    this.multilanguageFieldsLookup,
                    this.specificationLookup
                ];
                const productDataWithValues = await product_model_1.default.aggregate(pipeline);
                return productDataWithValues[0] || null;
            }
            else {
                return null;
            }
        }
        catch (error) {
            return null;
        }
    }
    async update(productId, productData) {
        return product_model_1.default.findByIdAndUpdate(productId, productData, { new: true, useFindAndModify: false });
    }
    async destroy(productId) {
        return product_model_1.default.findOneAndDelete({ _id: productId });
    }
    async findGalleryImagesByProductId(_id, productId) {
        let query = {};
        if (_id) {
            query._id = _id;
        }
        if (productId) {
            query.productID = productId;
        }
        return product_gallery_images_model_1.default.find(query).select('_id productID galleryImageUrl');
    }
    async createGalleryImages(gallaryImageData) {
        return product_gallery_images_model_1.default.create(gallaryImageData);
    }
    async destroyGalleryImages(gallaryImageID) {
        return product_gallery_images_model_1.default.findOneAndDelete({ _id: gallaryImageID });
    }
    async findInventryPricingByProductId(_id, productId) {
        let query = {};
        if (_id) {
            query._id = _id;
        }
        if (productId) {
            query.productId = productId;
        }
        return await inventry_pricing_model_1.default.find(query);
    }
    async inventryDetailsService(productId, inventryDetails) {
        try {
            const existingEntries = await inventry_pricing_model_1.default.find({ productId: productId });
            const inventryPricingPromises = await Promise.all(inventryDetails.map(async (data) => {
                const existingEntry = existingEntries.find(entry => entry.countryID.toString() === data.countryID.toString());
                if (existingEntry) {
                    await inventry_pricing_model_1.default.updateOne({ _id: existingEntry._id }, { ...data, productId: productId });
                }
                else {
                    await inventry_pricing_model_1.default.create({ ...data, productId: productId });
                }
            }));
            await Promise.all(inventryPricingPromises);
            const countryIDsToRemove = existingEntries
                .filter(entry => !inventryDetails.some((data) => data.countryID.toString() === entry.countryID.toString()))
                .map(entry => entry.countryID);
            await inventry_pricing_model_1.default.deleteMany({ productId: productId, countryID: { $in: countryIDsToRemove } });
            return await inventry_pricing_model_1.default.find({ productId: productId });
        }
        catch (error) {
            console.error('Error in inventryDetailsService:', error);
            throw error;
        }
    }
    async updateWebsitePriority(container1, columnKey) {
        try {
            // Set columnKey to '0' for all documents initially
            await product_model_1.default.updateMany({ [columnKey]: { $gt: '0' } }, { [columnKey]: '0' });
            if (container1 && container1.length > 0) {
                // Loop through container1 and update [mode] for each corresponding document
                for (let i = 0; i < container1.length; i++) {
                    const productId = container1[i];
                    const product = await product_model_1.default.findById(productId);
                    if (product) {
                        product[columnKey] = (i + 1).toString();
                        await product.save({ validateBeforeSave: false });
                    }
                }
            }
        }
        catch (error) {
            throw new Error(error + 'Failed to update ' + columnKey);
        }
    }
    async checkRequiredColumns(worksheet, requiredColumns) {
        for (let column of requiredColumns) {
            if (!worksheet.includes(column)) {
                return column;
            }
        }
    }
}
exports.default = new ProductsService();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const pagination_1 = require("../../../components/pagination");
const product_model_1 = __importDefault(require("../../../model/admin/ecommerce/product-model"));
const product_gallery_images_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-gallery-images-model"));
const product_config_1 = require("../../../utils/config/product-config");
const common_config_1 = require("../../../utils/config/common-config");
const multi_languages_1 = require("../../../constants/multi-languages");
const collections_1 = require("../../../constants/collections");
const customer_config_1 = require("../../../utils/config/customer-config");
const product_variants_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-variants-model"));
class ProductsService {
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
        const variantLookupMatch = {
            $expr: {
                $eq: ['$countryId', new mongoose_1.default.Types.ObjectId(query['productVariants.countryId'])]
            },
            status: "1"
        };
        // const hasProductVariantsFilter = Object.keys(query).some(key => key.includes('productVariants'));
        let pipeline = [
            product_config_1.productCategoryLookup,
            {
                $lookup: {
                    from: `${collections_1.collections.ecommerce.products.productvariants.productvariants}`,
                    localField: '_id',
                    foreignField: 'productId',
                    as: 'productVariants',
                    pipeline: [
                        ...(query['productVariants.countryId'] ? [{ $match: variantLookupMatch }] : [])
                    ]
                }
            },
            product_config_1.brandLookup,
            { $match: query },
            product_config_1.brandObject,
            // this.multilanguageFieldsLookup,
            { $sort: finalSort },
        ];
        const facetPipeline = [
            {
                $facet: {
                    totalCount: [{ $match: query }, { $count: 'count' }],
                    products: [
                        { $skip: skip },
                        { $limit: limit }
                    ]
                }
            },
            {
                $project: {
                    totalCount: 1,
                    products: 1
                }
            }
        ];
        pipeline.push(...facetPipeline);
        const retVal = await product_model_1.default.aggregate(pipeline).exec();
        const products = retVal[0]?.products || [];
        const totalCount = retVal[0]?.totalCount?.[0]?.count || 0;
        return { products, totalCount };
    }
    async getTotalCount(query = {}) {
        try {
            let pipeline = [
                product_config_1.productCategoryLookup,
                {
                    $lookup: {
                        from: `${collections_1.collections.ecommerce.products.productvariants.productvariants}`,
                        localField: '_id',
                        foreignField: 'productId',
                        as: 'productVariants',
                    },
                },
                product_config_1.brandLookup,
                product_config_1.brandObject,
                this.multilanguageFieldsLookup,
                { $match: query },
                {
                    $count: 'count'
                }
            ];
            const data = await product_model_1.default.aggregate(pipeline).exec();
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
        return product_model_1.default.create(productData);
    }
    async findOne(productId) {
        try {
            if (productId) {
                const objectId = new mongoose_1.default.Types.ObjectId(productId);
                const pipeline = [
                    { $match: { _id: objectId } },
                    product_config_1.productCategoryLookup,
                    product_config_1.variantLookup,
                    product_config_1.imageLookup,
                    product_config_1.brandLookup,
                    product_config_1.brandObject,
                    (0, common_config_1.seoLookup)('productSeo'),
                    product_config_1.productSeoObject,
                    this.multilanguageFieldsLookup,
                    product_config_1.specificationsLookup
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
    async exportProducts(options = {}) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        const variantLookupMatch = {
            $expr: {
                $eq: ['$countryId', new mongoose_1.default.Types.ObjectId(query['productVariants.countryId'])]
            },
            status: "1"
        };
        const pipeline = [
            product_config_1.productCategoryLookup,
            {
                $lookup: {
                    from: `${collections_1.collections.ecommerce.products.productvariants.productvariants}`,
                    localField: '_id',
                    foreignField: 'productId',
                    as: 'productVariants',
                    pipeline: [
                        ...(query['productVariants.countryId'] ? [{ $match: variantLookupMatch }] : []),
                        ...product_config_1.productVariantAttributesAdminLookup,
                        product_config_1.addFieldsProductVariantAttributes,
                        ...product_config_1.productSpecificationAdminLookup,
                        product_config_1.addFieldsProductSpecification,
                        product_config_1.productSeoLookup,
                        product_config_1.addFieldsProductSeo,
                        product_config_1.variantImageGalleryLookup,
                        customer_config_1.countriesLookup
                    ]
                },
            },
            product_config_1.brandLookup,
            { $match: query },
            { $skip: skip },
            { $limit: limit },
            product_config_1.imageLookup,
            product_config_1.brandObject,
            (0, common_config_1.seoLookup)('productSeo'),
            product_config_1.productSeoObject,
            product_config_1.productSpecificationsLookup,
            this.multilanguageFieldsLookup,
            { $sort: finalSort },
        ];
        const productDataWithValues = await product_model_1.default.aggregate(pipeline);
        return productDataWithValues;
    }
    async variantProductList(options = {}) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        const { getCategory, getBrand, getAttribute, getSpecification, getCountry, getProductGalleryImage, getGalleryImage, isCount = 0 } = options;
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        let pipeline = [
            {
                $match: query,
            },
            { $sort: finalSort },
            product_config_1.productLookup,
            { $unwind: "$productDetails" },
        ];
        if (getCountry === '1') {
            pipeline.push(customer_config_1.countriesLookup, { $unwind: '$country' });
        }
        if (getCategory === '1') {
            pipeline.push(...product_config_1.productCategoryLookupVariantWise);
        }
        if (getBrand === '1') {
            pipeline.push(...product_config_1.brandLookupVariant);
        }
        if (getAttribute === '1') {
            pipeline.push(...product_config_1.productVariantAttributesAdminLookup, product_config_1.addFieldsProductVariantAttributes);
        }
        if (getSpecification === '1') {
            pipeline.push(...product_config_1.productSpecificationAdminLookup, product_config_1.addFieldsProductSpecification);
        }
        if (getProductGalleryImage === '1') {
            pipeline.push(product_config_1.imageLookupVariantWise);
        }
        if (getGalleryImage === '1') {
            pipeline.push(product_config_1.variantImageGalleryLookup);
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
        const dataPipeline = [{ $match: {} }];
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
        }, (isCount === 1 ? {
            $project: {
                data: 1,
                totalCount: { $arrayElemAt: ["$totalCount.totalCount", 0] }
            }
        } :
            {
                $project: {
                    data: 1,
                }
            }));
        // pipeline.push(productLookup)
        const outOfStockSKUs = await product_variants_model_1.default.aggregate(pipeline);
        const products = outOfStockSKUs[0].data;
        if (isCount == 1) {
            const totalCount = outOfStockSKUs[0].totalCount;
            return { products, totalCount };
        }
        else {
            return products;
        }
    }
}
exports.default = new ProductsService();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRequiredColumns = exports.deleteFunction = exports.defaultSLugAndSkuSettings = exports.filterProduct = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const helpers_1 = require("../helpers");
const collections_products_service_1 = __importDefault(require("../../services/admin/website/collections-products-service"));
const general_service_1 = __importDefault(require("../../services/admin/general-service"));
const product_category_link_model_1 = __importDefault(require("../../model/admin/ecommerce/product/product-category-link-model"));
const product_model_1 = __importDefault(require("../../model/admin/ecommerce/product-model"));
const product_specification_model_1 = __importDefault(require("../../model/admin/ecommerce/product/product-specification-model"));
const product_variants_model_1 = __importDefault(require("../../model/admin/ecommerce/product/product-variants-model"));
const multi_language_fieleds_model_1 = __importDefault(require("../../model/admin/multi-language-fieleds-model"));
const seo_page_model_1 = __importDefault(require("../../model/admin/seo-page-model"));
const filterProduct = async (data, countryId) => {
    let query = { _id: { $exists: true } };
    let queryFilterIds;
    let queryDate;
    if (countryId) {
        queryFilterIds = {
            ...queryFilterIds,
            'productVariants.countryId': countryId
        };
    }
    if (data.status && data.status !== '') {
        query.status = { $in: Array.isArray(data.status) ? data.status : [data.status] };
    }
    else {
        query.status = '1';
    }
    if (data.keyword) {
        const keywordRegex = new RegExp(data.keyword, 'i');
        query = {
            $or: [
                { productTitle: keywordRegex },
                { slug: keywordRegex },
                { sku: keywordRegex },
                { 'productCategory.category.categoryTitle': keywordRegex },
                { 'brand.brandTitle': keywordRegex },
                { 'productCategory.category.slug': keywordRegex },
                { 'brand.slug': keywordRegex },
                { 'productVariants.slug': keywordRegex },
                { 'productVariants.variantSku': keywordRegex },
                { 'productVariants.extraProductTitle': keywordRegex }
            ],
            ...query
        };
    }
    if (data.fromDate || data.endDate) {
        if (data.fromDate) {
            queryDate = {
                ...queryDate,
                createdAt: {
                    $gte: new Date(data.fromDate)
                }
            };
        }
        if (data.endDate) {
            queryDate = {
                ...queryDate,
                createdAt: {
                    $lte: (0, helpers_1.dateConvertPm)(data.endDate)
                }
            };
        }
    }
    if (data.slug) {
        query = {
            ...query, slug: data.slug
        };
    }
    if (data.productId) {
        query = {
            ...query, _id: new mongoose_1.default.Types.ObjectId(data.productId)
        };
    }
    if (data.categoryId) {
        queryFilterIds = {
            ...queryFilterIds,
            'productCategory.category._id': new mongoose_1.default.Types.ObjectId(data.categoryId)
        };
    }
    if (data.brandId) {
        queryFilterIds = {
            ...queryFilterIds,
            'brand._id': new mongoose_1.default.Types.ObjectId(data.brandId)
        };
    }
    if (data.attributeId) {
        queryFilterIds = {
            ...queryFilterIds,
            'productVariants.productVariantAttributes.attributeId': new mongoose_1.default.Types.ObjectId(data.attributeId)
        };
        if (data.attributeDetailId) {
            queryFilterIds = {
                ...queryFilterIds,
                'productVariants.productVariantAttributes.attributeDetail._id': new mongoose_1.default.Types.ObjectId(data.attributeDetailId)
            };
        }
    }
    if (data.specificationId) {
        queryFilterIds = {
            ...queryFilterIds,
            'productVariants.productSpecification.specificationId': new mongoose_1.default.Types.ObjectId(data.specificationId)
        };
        if (data.specificationDetailId) {
            queryFilterIds = {
                ...queryFilterIds,
                'productVariants.productSpecification.specificationDetail._id': new mongoose_1.default.Types.ObjectId(data.specificationDetailId)
            };
        }
    }
    if (queryFilterIds && (Object.keys(queryFilterIds)).length > 0) {
        query = {
            ...query, ...queryFilterIds
        };
    }
    if (queryDate && (Object.keys(queryDate)).length > 0) {
        query = {
            ...query, ...queryDate
        };
    }
    const keysToCheck = ['newArrivalPriority', 'corporateGiftsPriority'];
    const filteredQuery = keysToCheck.reduce((result, key) => {
        if (key in data) {
            result[key] = data[key];
        }
        return result;
    }, {});
    let filteredPriorityQuery = {};
    if (Object.keys(filteredQuery).length > 0) {
        for (const key in filteredQuery) {
            if (filteredQuery[key] === '> 0') {
                filteredPriorityQuery[key] = { $gt: '0' }; // Set query for key greater than 0
            }
            else if (filteredQuery[key] === '0') {
                filteredPriorityQuery[key] = '0'; // Set query for key equal to 0
            }
            else if (filteredQuery[key] === '< 0' || filteredQuery[key] === null || filteredQuery[key] === undefined) {
                filteredPriorityQuery[key] = { $lt: '0' }; // Set query for key less than 0
            }
        }
    }
    if (data.unCollectionedProducts) {
        const collection = await collections_products_service_1.default.findOne(data.unCollectionedProducts);
        if (collection) {
            const unCollectionedProductIds = collection.collectionsProducts.map(id => new mongoose_1.default.Types.ObjectId(id));
            if (unCollectionedProductIds.length > 0) {
                query._id = { $nin: unCollectionedProductIds };
                query.status = '1';
            }
        }
    }
    query = { ...query, ...filteredPriorityQuery };
    const sort = {};
    if (data.sortby && data.sortorder) {
        sort[data.sortby] = data.sortorder === 'desc' ? -1 : 1;
    }
    return {
        query: query,
        sort: sort
    };
};
exports.filterProduct = filterProduct;
const defaultSLugAndSkuSettings = async (variants, allCountryData, productTitle) => {
    let variantSkuData = {};
    const result = variants.flatMap(({ countryId, productVariants }, index) => {
        const getCountryWithVariant = allCountryData.find((country) => String(country._id) === countryId);
        const defaultVariant = productVariants.find(variant => variant.isDefault === '1');
        if (defaultVariant) {
            variantSkuData = {
                countryId,
                variantSku: defaultVariant?.variantSku,
                slug: (0, helpers_1.slugify)(productTitle + " " + getCountryWithVariant.countryShortTitle + '-' + (index + 1))
            };
        }
        else {
            const maxQuantityItem = productVariants.reduce((max, current) => {
                return max.quantity > current.quantity ? max : current;
            });
            if (maxQuantityItem) {
                variantSkuData = {
                    countryId,
                    variantSku: maxQuantityItem?.variantSku,
                    slug: (0, helpers_1.slugify)(productTitle + " " + getCountryWithVariant.countryShortTitle + '-' + (index + 1))
                };
            }
        }
    });
    return variantSkuData;
};
exports.defaultSLugAndSkuSettings = defaultSLugAndSkuSettings;
const deleteFunction = async (productId) => {
    return await general_service_1.default.deleteParentModel([
        // ...(newProduct?._id &&
        {
            _id: productId,
            model: product_model_1.default
        },
        {
            productId: productId,
            model: product_variants_model_1.default
        },
        {
            pageId: productId,
            model: seo_page_model_1.default
        },
        {
            productId: productId,
            model: product_specification_model_1.default
        },
        {
            sourceId: productId,
            model: multi_language_fieleds_model_1.default
        },
        {
            productId: productId,
            model: product_category_link_model_1.default
        }
        // )
    ]);
};
exports.deleteFunction = deleteFunction;
const checkRequiredColumns = async (worksheet, requiredColumns) => {
    for (let column of requiredColumns) {
        if (!worksheet.includes(column)) {
            return column;
        }
    }
};
exports.checkRequiredColumns = checkRequiredColumns;

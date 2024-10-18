"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const fuse_js_1 = __importDefault(require("fuse.js"));
const pages_1 = require("../../../constants/pages");
const specification_config_1 = require("../../../utils/config/specification-config");
const attribute_config_1 = require("../../../utils/config/attribute-config");
const search_suggestion_config_1 = require("../../../utils/config/search-suggestion-config");
const base_controller_1 = __importDefault(require("../../admin/base-controller"));
const product_service_1 = __importDefault(require("../../../services/frontend/guest/product-service"));
const common_service_1 = __importDefault(require("../../../services/frontend/guest/common-service"));
const category_model_1 = __importDefault(require("../../../model/admin/ecommerce/category-model"));
const product_variants_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-variants-model"));
const product_model_1 = __importDefault(require("../../../model/admin/ecommerce/product-model"));
const seo_page_model_1 = __importDefault(require("../../../model/admin/seo-page-model"));
const product_gallery_images_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-gallery-images-model"));
const product_specification_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-specification-model"));
const brands_model_1 = __importDefault(require("../../../model/admin/ecommerce/brands-model"));
const product_variant_attribute_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-variant-attribute-model"));
const search_query_model_1 = __importDefault(require("../../../model/frontend/search-query-model"));
const product_category_link_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-category-link-model"));
const attribute_detail_model_1 = __importDefault(require("../../../model/admin/ecommerce/attribute-detail-model"));
const specifications_detail_model_1 = __importDefault(require("../../../model/admin/ecommerce/specifications-detail-model"));
const controller = new base_controller_1.default();
class ProductController extends base_controller_1.default {
    async findAllVariantProductsV1(req, res) {
        const { page_size = 1, limit = 20, keyword = '', getbrand = '0', category = '', brand = '', collectionproduct = '', collectionbrand = '', collectioncategory = '', getimagegallery = 0, categories = '', brands = '', attribute = '', specification = '', offer = '', sortby = '', sortorder = '', maxprice = '', minprice = '', discount = '', getattribute = '', getdiscount = '', getfilterattributes = '', getspecification = '' } = req.query;
        let query = {};
        let collectionProductsData = null;
        let discountValue;
        let offers;
        // query.status = '1';
        const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
        if (!countryId) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Error',
                validation: 'Country is missing'
            }, req);
        }
        let sort = {};
        let keywordRegex = undefined;
        let keywordRegexSingle = undefined;
        let productIds = [];
        let productFindableValues = {
            matchProductIds: []
        };
        let keywordSearch = {};
        let brandFilter = {};
        if (sortby && sortorder) {
            sort[sortby] = sortorder === 'desc' ? -1 : 1;
        }
        if (!brand && !category && keyword) {
            keywordRegex = new RegExp(`${keyword}`, 'i');
            const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            keywordRegexSingle = new RegExp(`\\b${escapedKeyword}`, 'i');
            // keywordRegex = new RegExp(`^${keyword}`, 'i');
            keywordSearch = {
                $or: [
                    { 'productDetails.productTitle': { $regex: `${keywordRegexSingle}` } },
                    { 'extraProductTitle': { $regex: `${keywordRegexSingle}` } },
                    { slug: { $regex: `${keywordRegexSingle}` } },
                    { 'variantSku': keywordRegex },
                ],
            };
            if (page_size === 1 && typeof keyword === 'string' && keyword.trim() !== '' && keyword.trim().length > 2 && keyword !== 'undefined' && keyword !== 'null' && keyword !== null && !Number.isNaN(Number(keyword)) && keyword !== false.toString()) {
                const customer = null;
                const guestUser = res.locals.uuid || null;
                await product_service_1.default.insertOrUpdateSearchQuery(keyword, countryId, customer ? new mongoose_1.default.Types.ObjectId(customer) : null, guestUser);
            }
        }
        async function fetchAllCategories(categoryIds) {
            let queue = [...categoryIds];
            const allCategoryIds = new Set([...categoryIds]);
            while (queue.length > 0) {
                const categoriesData = await category_model_1.default.find({ parentCategory: { $in: queue } }, '_id');
                const childCategoryIds = categoriesData.map(category => category._id);
                if (childCategoryIds.length === 0) {
                    break;
                }
                queue = childCategoryIds;
                childCategoryIds.forEach(id => allCategoryIds.add(id));
            }
            return Array.from(allCategoryIds);
        }
        if (category || categories || keyword) {
            let categoryBatchIds = [];
            const fetchCategoryId = async (categoryValue) => {
                const isObjectId = /^[0-9a-fA-F]{24}$/.test(categoryValue);
                return isObjectId ? categoryValue : (await category_model_1.default.findOne({ slug: categoryValue }, '_id'))?._id || null;
            };
            if (!categories && category) {
                const categoryId = await fetchCategoryId(category);
                if (categoryId) {
                    categoryBatchIds.push(categoryId);
                }
            }
            else if (keyword) {
                const categoriesByTitle = await category_model_1.default.find({ categoryTitle: { $regex: `${keywordRegexSingle}` } }, '_id');
                categoryBatchIds.push(...categoriesByTitle.map(category => category._id));
            }
            if (categories) {
                const categoryArray = Array.isArray(categories) ? categories : categories.split(',');
                const categoryIds = await Promise.all(categoryArray.map(fetchCategoryId));
                if (!keyword) {
                    categoryBatchIds = categoryIds.filter(Boolean);
                }
                else {
                    categoryBatchIds.push(...categoryIds.filter(Boolean));
                }
            }
            const categoryIds = await fetchAllCategories([...new Set(categoryBatchIds)]);
            if (categoryIds.length > 0) {
                const categoryProductIds = await product_category_link_model_1.default.distinct('productId', { categoryId: { $in: categoryIds } });
                productIds = [...new Set(categoryProductIds)];
                productFindableValues = {
                    ...productFindableValues,
                    categoryProductIds: productIds,
                    matchProductIds: [...new Set(categoryProductIds)],
                    categoryIds
                };
            }
        }
        if (brands || brand || keyword) {
            let brandIds = [];
            let brandSlugs = [];
            const processBrand = async (brandValue) => {
                const isObjectId = /^[0-9a-fA-F]{24}$/.test(brandValue);
                if (isObjectId) {
                    brandIds.push(new mongoose_1.default.Types.ObjectId(brandValue));
                }
                else {
                    brandSlugs.push(brandValue);
                }
            };
            if (!brands && brand) {
                await processBrand(brand);
            }
            if (brands) {
                const brandArray = Array.isArray(brands) ? brands : brands.split(',');
                await Promise.all(brandArray.map(processBrand));
            }
            if (!brand && keyword) {
                const brandByTitleId = await brands_model_1.default.find({
                    $or: [
                        { brandTitle: { $regex: `${'citizen'}` } },
                        { slug: { $regex: `${'citizen'}` } },
                    ]
                }, '_id');
                if (brandByTitleId && brandByTitleId.length > 0) {
                    // query = {
                    //     $or: [
                    //         { "productDetails.brand": { $in: brandByTitleId.map(brand => brand._id) } }     // Brand-based filter (only applied if brands are found)
                    //     ]
                    // };
                    brandFilter = { "productDetails.brand": { $in: brandByTitleId.map(brand => brand._id) } };
                    // query = {
                    //     ...query,
                    //     "productDetails.brand": { $in: brandByTitleId.map(brand => brand._id) },
                    // }
                }
            }
            if (brandSlugs.length > 0) {
                const foundBrands = await brands_model_1.default.find({ slug: { $in: brandSlugs } }, '_id');
                if (foundBrands && foundBrands.length > 0) {
                    // query = {
                    //     ...query, "productDetails.brand": { $in: foundBrands.map(brand => brand._id) },
                    // }
                    const ids = foundBrands.map(brand => brand._id);
                    brandIds = [...new Set([...brandIds, ...ids])];
                    brandFilter = { "productDetails.brand": { $in: ids } };
                }
            }
            let matchProductIds = [];
            if (brand && brandIds.length > 0) {
                matchProductIds = await product_model_1.default.distinct('_id', { brand: { $in: brandIds }, _id: { $in: productIds } });
            }
            else {
                if (brandIds.length > 0) {
                    brandFilter = { "productDetails.brand": { $in: brandIds } };
                    // query = {
                    //     ...query, "productDetails.brand": { $in: brandIds }
                    // }
                    // const brandProductIds = await ProductsModel.distinct('_id', { brand: { $in: brandIds } });
                    // productIds = [...new Set([...productIds, ...brandProductIds])];
                }
                else if (brand) {
                    query = {
                        ...query, "productDetails.brand": { $in: [] }
                    };
                }
            }
            productFindableValues = {
                ...productFindableValues,
                matchProductIds: [...new Set([...productFindableValues.matchProductIds, ...matchProductIds])],
                brand: {
                    ...(productFindableValues.brand || {}),
                    brandIds: [...(productFindableValues.brand?.brandIds || []), ...brandIds],
                    brandSlugs: brandSlugs.length > 0 ? [...(productFindableValues.brand?.brandSlugs || []), ...brandSlugs] : undefined
                }
            };
        }
        if (attribute || keyword) {
            let attributeDetailIds = [];
            let attributeDetailNames = [];
            const attributeArray = attribute ? attribute.split(',') : [];
            for (let attr of attributeArray) {
                const isObjectId = /^[0-9a-fA-F]{24}$/.test(attr);
                if (isObjectId) {
                    attributeDetailIds.push(new mongoose_1.default.Types.ObjectId(attr));
                }
                else {
                    attributeDetailNames.push(attr);
                }
            }
            productFindableValues = {
                ...productFindableValues,
                attribute: {
                    ...(productFindableValues.attribute || {}),
                    ...(attributeDetailIds.length > 0 && {
                        attributeDetailIds: [
                            ...(productFindableValues.attribute?.attributeDetailIds || []),
                            ...attributeDetailIds
                        ]
                    }),
                    ...(attributeDetailNames.length > 0 && {
                        attributeDetailNames: [
                            ...(productFindableValues.attribute?.attributeDetailNames || []),
                            ...attributeDetailNames
                        ]
                    })
                }
            };
            if (keyword) {
                const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                keywordRegexSingle = new RegExp(`\\b${escapedKeyword}`, 'i');
            }
            if ((attributeDetailIds.length > 0 || attributeDetailNames.length > 0) || keywordRegexSingle) {
                const attributeDetailsQuery = {
                    $or: []
                };
                if (attributeDetailNames.length > 0) {
                    attributeDetailsQuery.$or.push({ itemName: { $in: attributeDetailNames } });
                }
                if (keywordRegexSingle) {
                    attributeDetailsQuery.$or.push({ itemName: { $regex: `${keywordRegexSingle}` } });
                }
                if (attributeDetailsQuery.$or.length > 0) {
                    const attributeDetails = await attribute_detail_model_1.default.find(attributeDetailsQuery, '_id attributeId itemName itemValue');
                    if (attributeDetails.length > 0) {
                        const attributeProductIds = await product_variant_attribute_model_1.default.aggregate([
                            {
                                $match: {
                                    attributeDetailId: { $in: attributeDetails.map((detail) => detail._id) },
                                    productId: { $nin: productIds }
                                }
                            },
                            {
                                $group: {
                                    _id: "$productId"
                                }
                            },
                            {
                                $limit: 300
                            },
                            {
                                $project: {
                                    _id: 0,
                                    productId: "$_id"
                                }
                            }
                        ]);
                        productIds = [...new Set([...productIds, ...attributeProductIds.map((p) => p.productId)])];
                    }
                }
            }
        }
        if (specification || keyword) {
            let specificationDetailIds = [];
            let specificationDetailNames = [];
            const specificationArray = specification ? specification.split(',') : [];
            for (let spec of specificationArray) {
                const isObjectId = /^[0-9a-fA-F]{24}$/.test(spec);
                if (isObjectId) {
                    specificationDetailIds.push(new mongoose_1.default.Types.ObjectId(spec));
                }
                else {
                    specificationDetailNames.push(spec);
                }
            }
            productFindableValues = {
                ...productFindableValues,
                specification: {
                    ...(productFindableValues.specification || {}),
                    ...(specificationDetailIds.length > 0 && {
                        specificationDetailIds: [
                            ...(productFindableValues.specification?.specificationDetailIds || []),
                            ...specificationDetailIds
                        ]
                    }),
                    ...(specificationDetailNames.length > 0 && {
                        specificationDetailNames: [
                            ...(productFindableValues.specification?.specificationDetailNames || []),
                            ...specificationDetailNames
                        ]
                    })
                }
            };
            if (keyword) {
                const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                keywordRegexSingle = new RegExp(`\\b${escapedKeyword}`, 'i');
            }
            if ((specificationDetailIds.length > 0 || specificationDetailNames.length > 0) || keywordRegexSingle) {
                const specificationDetailsQuery = { $or: [] };
                if (specificationDetailNames.length > 0) {
                    specificationDetailsQuery.$or.push({ itemName: { $in: specificationDetailNames } });
                }
                if (keywordRegexSingle) {
                    specificationDetailsQuery.$or.push({ itemName: { $regex: `${keywordRegexSingle}` } });
                }
                if (specificationDetailsQuery.$or.length > 0) {
                    const specificationDetails = await specifications_detail_model_1.default.find(specificationDetailsQuery, '_id specificationId itemName itemValue');
                    if (specificationDetails.length > 0) {
                        const specificationProductIds = await product_specification_model_1.default.aggregate([
                            {
                                $match: {
                                    specificationDetailId: { $in: specificationDetails.map((detail) => detail._id) },
                                    productId: { $nin: productIds }
                                }
                            },
                            {
                                $group: {
                                    _id: "$productId"
                                }
                            },
                            {
                                $limit: 200
                            },
                            {
                                $project: {
                                    _id: 0,
                                    productId: "$_id"
                                }
                            }
                        ]);
                        productIds = [...new Set([...productIds, ...specificationProductIds.map((p) => p.productId)])];
                    }
                }
            }
        }
        if (collectionproduct) {
            collectionProductsData = {
                ...collectionProductsData, collectionproduct: new mongoose_1.default.Types.ObjectId(collectionproduct)
            };
            productFindableValues = {
                ...productFindableValues,
                collectionProductsData: {
                    collectionproduct: new mongoose_1.default.Types.ObjectId(collectionproduct)
                }
            };
        }
        if (collectionbrand) {
            collectionProductsData = {
                ...collectionProductsData, collectionbrand: new mongoose_1.default.Types.ObjectId(collectionbrand)
            };
            productFindableValues = {
                ...productFindableValues,
                collectionProductsData: {
                    ...(productFindableValues.collectionProductsData || {}),
                    collectionbrand: new mongoose_1.default.Types.ObjectId(collectionbrand)
                }
            };
        }
        if (collectioncategory) {
            collectionProductsData = {
                ...collectionProductsData, collectioncategory: new mongoose_1.default.Types.ObjectId(collectioncategory)
            };
            productFindableValues = {
                ...productFindableValues,
                collectionProductsData: {
                    ...(productFindableValues.collectionProductsData || {}),
                    collectioncategory: new mongoose_1.default.Types.ObjectId(collectioncategory)
                }
            };
        }
        if (Object.keys(brandFilter).length > 0 && Object.keys(keywordSearch).length > 0) {
            console.log('brandFilter', brandFilter, keywordSearch);
            if (keywordSearch?.$or) {
                keywordSearch.$or.push(brandFilter);
            }
            query = {
                ...query,
                $or: [
                    keywordSearch
                ]
            };
        }
        else if (Object.keys(brandFilter).length > 0) {
            query = {
                ...query,
                $or: [
                    brandFilter
                ]
            };
        }
        else if (Object.keys(keywordSearch).length > 0) {
            query = {
                ...query,
                $or: [
                    keywordSearch
                ]
            };
        }
        if (productIds.length > 0) {
            if (query.$or) {
                query.$or.push({ productId: { $in: productIds } });
            }
            else {
                query.$or = [{ productId: { $in: productIds } }];
            }
        }
        const productDatas = await product_service_1.default.getProductVariantDetailsV1(productFindableValues, {
            countryId,
            page: parseInt(page_size),
            limit: parseInt(limit),
            query,
            queryValues: {
                page_size,
                keyword,
                brand,
                brands,
                category,
                categories,
                collectionproduct,
                collectioncategory,
                collectionbrand,
                specification,
                attribute
            },
            sort,
            collectionProductsData,
            discount,
            offers,
            getbrand,
            getfilterattributes,
            getimagegallery,
            getattribute,
            getspecification,
            getdiscount,
            hostName: req.get('origin'),
            maxprice,
            minprice,
            isCount: 1
        });
        return controller.sendSuccessResponse(res, {
            requestedData: productDatas,
            message: 'Success!'
        }, 200);
    }
    async findAllProductsV2(req, res) {
        try {
            const { page_size = 1, limit = 20, keyword = '', getbrand = '0', category = '', brand = '', collectionproduct = '', collectionbrand = '', collectioncategory = '', getimagegallery = 0, categories = '', brands = '', attribute = '', specification = '', offer = '', sortby = '', sortorder = '', maxprice = '', minprice = '', discount = '', getattribute = '', getspecification = '' } = req.query;
            let query = { _id: { $exists: true } };
            let collectionProductsData = null;
            let discountValue;
            let offers;
            query.status = '1';
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                let sort = {};
                let keywordRegex = undefined;
                let keywordRegexSingle = undefined;
                let productIds = [];
                if (sortby && sortorder) {
                    sort[sortby] = sortorder === 'desc' ? -1 : 1;
                }
                if (keyword) {
                    const keywordRegex = new RegExp(`${keyword}`, 'i');
                    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    keywordRegexSingle = new RegExp(`\\b${escapedKeyword}`, 'i');
                    // keywordRegex = new RegExp(`^${keyword}`, 'i');
                    query = {
                        $or: [
                            { productTitle: { $regex: keywordRegexSingle } },
                            { slug: { $regex: keywordRegex } },
                            { sku: { $regex: keywordRegex } },
                            // { 'productCategory.category.categoryTitle': { $regex: keywordRegex } },
                            // { 'brand.brandTitle': { $regex: keywordRegex } },
                            // { 'productCategory.category.slug': { $regex: keywordRegex } },
                            { 'productVariants.slug': { $regex: keywordRegex } },
                            { 'productVariants.extraProductTitle': { $regex: keywordRegex } },
                            { 'productVariants.variantSku': { $regex: keywordRegex } },
                            // { 'productSpecification.specificationTitle': { $regex: keywordRegex } },
                            // { 'productSpecification.specificationDetail.itemName': { $regex: keywordRegex } },
                            // { 'productSpecification.specificationDetail.itemValue': { $regex: keywordRegex } },
                            // // { 'productVariants.productSpecification.specificationTitle': { $regex: keywordRegex } },
                            // { 'productVariants.productSpecification.specificationDetail.itemName': { $regex: keywordRegex } },
                            // { 'productVariants.productSpecification.specificationDetail.itemValue': { $regex: keywordRegex } },
                            // // { 'productVariants.productVariantAttributes.attributeTitle': { $regex: keywordRegex } },
                            // { 'productVariants.productVariantAttributes.attributeDetail.itemName': { $regex: keywordRegex } },
                            // { 'productVariants.productVariantAttributes.attributeDetail.itemValue': { $regex: keywordRegex } }
                        ],
                        ...query
                    };
                    const keywordProductIds = await product_model_1.default.aggregate([
                        {
                            $match: {
                                $or: [
                                    { productTitle: { $regex: keywordRegexSingle } },
                                    { slug: { $regex: keywordRegexSingle } },
                                    { sku: { $regex: keywordRegexSingle } }
                                ]
                            }
                        },
                        {
                            $project: { _id: 1 }
                        }
                    ]);
                    if (keywordProductIds.length > 0) {
                        productIds = [...new Set(keywordProductIds.map((id) => id._id))];
                    }
                    const keywordVariantProductIds = await product_variants_model_1.default.aggregate([
                        {
                            $match: {
                                $or: [
                                    { extraProductTitle: { $regex: keywordRegexSingle } },
                                    { slug: { $regex: keywordRegexSingle } },
                                    { variantSku: { $regex: keywordRegexSingle } }
                                ]
                            }
                        },
                        {
                            $project: { productId: 1 }
                        }
                    ]);
                    if (keywordVariantProductIds.length > 0) {
                        productIds = [...new Set(keywordVariantProductIds.map((id) => id.productId))];
                    }
                    if (page_size === 1 && typeof keyword === 'string' && keyword.trim() !== '' && keyword.trim().length > 2 && keyword !== 'undefined' && keyword !== 'null' && keyword !== null && !Number.isNaN(Number(keyword)) && keyword !== false.toString()) {
                        const customer = null;
                        const guestUser = res.locals.uuid || null;
                        await product_service_1.default.insertOrUpdateSearchQuery(keyword, countryId, customer ? new mongoose_1.default.Types.ObjectId(customer) : null, guestUser);
                    }
                }
                async function fetchAllCategories(categoryIds) {
                    let queue = [...categoryIds];
                    const allCategoryIds = new Set([...categoryIds]);
                    while (queue.length > 0) {
                        const categoriesData = await category_model_1.default.find({ parentCategory: { $in: queue } }, '_id');
                        const childCategoryIds = categoriesData.map(category => category._id);
                        if (childCategoryIds.length === 0) {
                            break;
                        }
                        queue = childCategoryIds;
                        childCategoryIds.forEach(id => allCategoryIds.add(id));
                    }
                    return Array.from(allCategoryIds);
                }
                let productFindableValues = {};
                if (category || categories || keyword) {
                    let categoryBatchIds = [];
                    const fetchCategoryId = async (categoryValue) => {
                        const isObjectId = /^[0-9a-fA-F]{24}$/.test(categoryValue);
                        return isObjectId ? categoryValue : (await category_model_1.default.findOne({ slug: categoryValue }, '_id'))?._id || null;
                    };
                    if (!categories && category) {
                        const categoryId = await fetchCategoryId(category);
                        if (categoryId) {
                            categoryBatchIds.push(categoryId);
                        }
                    }
                    else if (keyword) {
                        const categoriesByTitle = await category_model_1.default.find({ categoryTitle: { $regex: keywordRegexSingle } }, '_id');
                        categoryBatchIds.push(...categoriesByTitle.map(category => category._id));
                    }
                    if (categories) {
                        const categoryArray = Array.isArray(categories) ? categories : categories.split(',');
                        const categoryIds = await Promise.all(categoryArray.map(fetchCategoryId));
                        if (!keyword) {
                            categoryBatchIds = categoryIds.filter(Boolean);
                        }
                        else {
                            categoryBatchIds.push(...categoryIds.filter(Boolean));
                        }
                    }
                    const categoryIds = await fetchAllCategories([...new Set(categoryBatchIds)]);
                    if (categoryIds.length > 0) {
                        const categoryProductIds = await product_category_link_model_1.default.distinct('productId', { categoryId: { $in: categoryIds } });
                        productIds = [...new Set(categoryProductIds)];
                        productFindableValues = {
                            ...productFindableValues,
                            categoryProductIds: productIds,
                            categoryIds
                        };
                    }
                }
                if (brands || brand || keyword) {
                    let brandIds = [];
                    let brandSlugs = [];
                    const processBrand = async (brandValue) => {
                        const isObjectId = /^[0-9a-fA-F]{24}$/.test(brandValue);
                        if (isObjectId) {
                            brandIds.push(new mongoose_1.default.Types.ObjectId(brandValue));
                        }
                        else {
                            brandSlugs.push(brandValue);
                        }
                    };
                    if (!brands && brand) {
                        await processBrand(brand);
                    }
                    if (brands) {
                        const brandArray = Array.isArray(brands) ? brands : brands.split(',');
                        await Promise.all(brandArray.map(processBrand));
                    }
                    if (keyword) {
                        const brandByTitleId = await brands_model_1.default.find({ brandTitle: { $regex: keywordRegexSingle } }, '_id');
                        if (brandByTitleId && brandByTitleId.length > 0) {
                            if (query.$or) {
                                query.$or = [
                                    ...query.$or,
                                    { brand: { $in: brandByTitleId.map(brand => brand._id) } },
                                ];
                            }
                            else {
                                query.$or = [
                                    { brand: { $in: brandByTitleId.map(brand => brand._id) } },
                                ];
                            }
                        }
                        brandIds.push(...brandByTitleId.map(brand => brand._id));
                    }
                    if (brandSlugs.length > 0) {
                        const foundBrands = await brands_model_1.default.find({ slug: { $in: brandSlugs } }, '_id');
                        brandIds.push(...foundBrands.map(brand => brand._id));
                    }
                    if (brand) {
                        query = {
                            ...query, "brand": { $in: brandIds }
                        };
                    }
                    else if (brandIds.length > 0) {
                        query = {
                            ...query, "brand": { $in: brandIds },
                        };
                        // if (brandIds.length > 0) {
                        //     if (query.$or) {
                        //         query.$or.push({ brand: { $in: brandIds } });
                        //     } else {
                        //         query.$or = [{ brand: { $in: brandIds } }];
                        //     }
                        // }
                    }
                    productFindableValues = {
                        ...productFindableValues,
                        brand: {
                            ...(productFindableValues.brand || {}),
                            brandIds: [...(productFindableValues.brand?.brandIds || []), ...brandIds],
                            brandSlugs: brandSlugs.length > 0 ? [...(productFindableValues.brand?.brandSlugs || []), ...brandSlugs] : undefined
                        }
                    };
                }
                if (attribute || keyword) {
                    let attributeDetailIds = [];
                    let attributeDetailNames = [];
                    const attributeArray = attribute ? attribute.split(',') : [];
                    for (let attr of attributeArray) {
                        const isObjectId = /^[0-9a-fA-F]{24}$/.test(attr);
                        if (isObjectId) {
                            attributeDetailIds.push(new mongoose_1.default.Types.ObjectId(attr));
                        }
                        else {
                            attributeDetailNames.push(attr);
                        }
                    }
                    productFindableValues = {
                        ...productFindableValues,
                        attribute: {
                            ...(productFindableValues.attribute || {}),
                            ...(attributeDetailIds.length > 0 && {
                                attributeDetailIds: [
                                    ...(productFindableValues.attribute?.attributeDetailIds || []),
                                    ...attributeDetailIds
                                ]
                            }),
                            ...(attributeDetailNames.length > 0 && {
                                attributeDetailNames: [
                                    ...(productFindableValues.attribute?.attributeDetailNames || []),
                                    ...attributeDetailNames
                                ]
                            })
                        }
                    };
                    if (keyword) {
                        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        keywordRegexSingle = new RegExp(`\\b${escapedKeyword}`, 'i');
                    }
                    if ((attributeDetailIds.length > 0 || attributeDetailNames.length > 0) || keywordRegexSingle) {
                        const attributeDetailsQuery = {
                            $or: []
                        };
                        if (attributeDetailNames.length > 0) {
                            attributeDetailsQuery.$or.push({ itemName: { $in: attributeDetailNames } });
                        }
                        if (keywordRegexSingle) {
                            attributeDetailsQuery.$or.push({ itemName: { $regex: keywordRegexSingle } });
                        }
                        if (attributeDetailsQuery.$or.length > 0) {
                            const attributeDetails = await attribute_detail_model_1.default.find(attributeDetailsQuery, '_id attributeId itemName itemValue');
                            if (attributeDetails.length > 0) {
                                const attributeProductIds = await product_variant_attribute_model_1.default.aggregate([
                                    {
                                        $match: {
                                            attributeDetailId: { $in: attributeDetails.map((detail) => detail._id) },
                                            productId: { $nin: productIds }
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: "$productId"
                                        }
                                    },
                                    {
                                        $limit: 300
                                    },
                                    {
                                        $project: {
                                            _id: 0,
                                            productId: "$_id"
                                        }
                                    }
                                ]);
                                productIds = [...new Set([...productIds, ...attributeProductIds.map((p) => p.productId)])];
                            }
                        }
                    }
                }
                if (specification || keyword) {
                    let specificationDetailIds = [];
                    let specificationDetailNames = [];
                    const specificationArray = specification ? specification.split(',') : [];
                    for (let spec of specificationArray) {
                        const isObjectId = /^[0-9a-fA-F]{24}$/.test(spec);
                        if (isObjectId) {
                            specificationDetailIds.push(new mongoose_1.default.Types.ObjectId(spec));
                        }
                        else {
                            specificationDetailNames.push(spec);
                        }
                    }
                    productFindableValues = {
                        ...productFindableValues,
                        specification: {
                            ...(productFindableValues.specification || {}),
                            ...(specificationDetailIds.length > 0 && {
                                specificationDetailIds: [
                                    ...(productFindableValues.specification?.specificationDetailIds || []),
                                    ...specificationDetailIds
                                ]
                            }),
                            ...(specificationDetailNames.length > 0 && {
                                specificationDetailNames: [
                                    ...(productFindableValues.specification?.specificationDetailNames || []),
                                    ...specificationDetailNames
                                ]
                            })
                        }
                    };
                    if (keyword) {
                        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        keywordRegexSingle = new RegExp(`\\b${escapedKeyword}`, 'i');
                    }
                    if ((specificationDetailIds.length > 0 || specificationDetailNames.length > 0) || keywordRegexSingle) {
                        const specificationDetailsQuery = { $or: [] };
                        if (specificationDetailNames.length > 0) {
                            specificationDetailsQuery.$or.push({ itemName: { $in: specificationDetailNames } });
                        }
                        if (keywordRegexSingle) {
                            specificationDetailsQuery.$or.push({ itemName: { $regex: keywordRegexSingle } });
                        }
                        if (specificationDetailsQuery.$or.length > 0) {
                            const specificationDetails = await specifications_detail_model_1.default.find(specificationDetailsQuery, '_id specificationId itemName itemValue');
                            if (specificationDetails.length > 0) {
                                const specificationProductIds = await product_specification_model_1.default.aggregate([
                                    {
                                        $match: {
                                            specificationDetailId: { $in: specificationDetails.map((detail) => detail._id) },
                                            productId: { $nin: productIds }
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: "$productId"
                                        }
                                    },
                                    {
                                        $limit: 200
                                    },
                                    {
                                        $project: {
                                            _id: 0,
                                            productId: "$_id"
                                        }
                                    }
                                ]);
                                productIds = [...new Set([...productIds, ...specificationProductIds.map((p) => p.productId)])];
                            }
                        }
                    }
                }
                if (collectionproduct) {
                    collectionProductsData = {
                        ...collectionProductsData, collectionproduct: new mongoose_1.default.Types.ObjectId(collectionproduct)
                    };
                    productFindableValues = {
                        ...productFindableValues,
                        collectionProductsData: {
                            collectionproduct: new mongoose_1.default.Types.ObjectId(collectionproduct)
                        }
                    };
                }
                if (collectionbrand) {
                    collectionProductsData = {
                        ...collectionProductsData, collectionbrand: new mongoose_1.default.Types.ObjectId(collectionbrand)
                    };
                    productFindableValues = {
                        ...productFindableValues,
                        collectionProductsData: {
                            ...(productFindableValues.collectionProductsData || {}),
                            collectionbrand: new mongoose_1.default.Types.ObjectId(collectionbrand)
                        }
                    };
                }
                if (collectioncategory) {
                    collectionProductsData = {
                        ...collectionProductsData, collectioncategory: new mongoose_1.default.Types.ObjectId(collectioncategory)
                    };
                    productFindableValues = {
                        ...productFindableValues,
                        collectionProductsData: {
                            ...(productFindableValues.collectionProductsData || {}),
                            collectioncategory: new mongoose_1.default.Types.ObjectId(collectioncategory)
                        }
                    };
                }
                if (offer) {
                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(offer);
                    let offerCondition;
                    if (isObjectId) {
                        offerCondition = { _id: new mongoose_1.default.Types.ObjectId(offer) };
                    }
                    else {
                        const keywordRegex = new RegExp(offer, 'i');
                        offerCondition = { slug: keywordRegex };
                    }
                    productFindableValues = {
                        ...productFindableValues,
                        offer: offerCondition
                    };
                }
                if (productIds.length > 0) {
                    if (query.$or) {
                        query.$or.push({ _id: { $in: productIds } });
                    }
                    else {
                        query.$or = [{ _id: { $in: productIds } }];
                    }
                    // query = {
                    //     ...query,
                    //     _id: { $in: productIds }
                    // };
                }
                const productDatas = await product_service_1.default.getProductDetailsV2(productFindableValues, {
                    countryId,
                    page: parseInt(page_size),
                    limit: parseInt(limit),
                    query,
                    sort,
                    collectionProductsData,
                    discount,
                    offers,
                    getbrand,
                    getimagegallery,
                    getattribute,
                    getspecification,
                    hostName: req.get('origin'),
                    maxprice,
                    minprice,
                    isCount: 1
                });
                if (discount) {
                    discountValue = {
                        ...discount, discount: discount
                    };
                }
                if (sortby == 'createdAt') {
                    if (sortorder === 'asc') {
                        sort = { createdAt: -1 };
                    }
                    else {
                        sort = { createdAt: 1 };
                    }
                }
                return controller.sendSuccessResponse(res, {
                    requestedData: productDatas,
                    message: 'Success!'
                }, 200);
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'Country is missing'
                }, req);
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching specifications' });
        }
    }
    async findAllProducts(req, res) {
        try {
            const { page_size = 1, limit = 20, keyword = '', category = '', brand = '', collectionproduct = '', collectionbrand = '', collectioncategory = '', getimagegallery = 0, categories = '', brands = '', attribute = '', specification = '', offer = '', sortby = '', sortorder = '', maxprice = '', minprice = '', discount = '', getattribute = '', getspecification = '' } = req.query;
            let query = { _id: { $exists: true } };
            let collectionProductsData = null;
            let discountValue;
            let offers;
            query.status = '1';
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                let sort = {};
                if (sortby && sortorder) {
                    sort[sortby] = sortorder === 'desc' ? -1 : 1;
                }
                if (keyword) {
                    // const keywordRegex = new RegExp(keyword, 'i');
                    const keywordRegex = new RegExp(`^${keyword}`, 'i');
                    query = {
                        $or: [
                            // { productTitle:  { $regex: regexQuery } },
                            { productTitle: { $regex: keywordRegex } },
                            { slug: { $regex: keywordRegex } },
                            { sku: { $regex: keywordRegex } },
                            { 'productCategory.category.categoryTitle': { $regex: keywordRegex } },
                            { 'brand.brandTitle': { $regex: keywordRegex } },
                            { 'productCategory.category.slug': { $regex: keywordRegex } },
                            { 'productVariants.slug': { $regex: keywordRegex } },
                            { 'productVariants.extraProductTitle': { $regex: keywordRegex } },
                            { 'productVariants.variantSku': { $regex: keywordRegex } },
                            // { 'productSpecification.specificationTitle': { $regex: keywordRegex } },
                            { 'productSpecification.specificationDetail.itemName': { $regex: keywordRegex } },
                            { 'productSpecification.specificationDetail.itemValue': { $regex: keywordRegex } },
                            // { 'productVariants.productSpecification.specificationTitle': { $regex: keywordRegex } },
                            { 'productVariants.productSpecification.specificationDetail.itemName': { $regex: keywordRegex } },
                            { 'productVariants.productSpecification.specificationDetail.itemValue': { $regex: keywordRegex } },
                            // { 'productVariants.productVariantAttributes.attributeTitle': { $regex: keywordRegex } },
                            { 'productVariants.productVariantAttributes.attributeDetail.itemName': { $regex: keywordRegex } },
                            { 'productVariants.productVariantAttributes.attributeDetail.itemValue': { $regex: keywordRegex } }
                        ],
                        ...query
                    };
                    if (page_size === 1 && typeof keyword === 'string' && keyword.trim() !== '' && keyword.trim().length > 2 && keyword !== 'undefined' && keyword !== 'null' && keyword !== null && !Number.isNaN(Number(keyword)) && keyword !== false.toString()) {
                        const customer = null;
                        const guestUser = res.locals.uuid || null;
                        await product_service_1.default.insertOrUpdateSearchQuery(keyword, countryId, customer ? new mongoose_1.default.Types.ObjectId(customer) : null, guestUser);
                    }
                }
                if (category) {
                    const categoryIsObjectId = /^[0-9a-fA-F]{24}$/.test(category);
                    var findcategory;
                    if (categoryIsObjectId) {
                        findcategory = { _id: category };
                    }
                    else {
                        findcategory = await category_model_1.default.findOne({ slug: category }, '_id');
                    }
                    if (findcategory && findcategory._id) {
                        let categoryIds = [findcategory._id];
                        async function fetchCategoryAndChildren(categoryId) {
                            let queue = [categoryId];
                            while (queue.length > 0) {
                                const currentCategoryId = queue.shift();
                                const categoriesData = await category_model_1.default.find({ parentCategory: currentCategoryId }, '_id');
                                const childCategoryIds = categoriesData.map(category => category._id);
                                queue.push(...childCategoryIds);
                                categoryIds.push(...childCategoryIds);
                            }
                        }
                        await fetchCategoryAndChildren(findcategory._id);
                        query = {
                            ...query, "productCategory.category._id": { $in: categoryIds }
                        };
                    }
                    else {
                        query = {
                            ...query, "productCategory.category._id": findcategory
                        };
                    }
                }
                if (categories) {
                    const categoryArray = categories.split(',');
                    let categoryIds = [];
                    for await (let category of categoryArray) {
                        const categoryIsObjectId = /^[0-9a-fA-F]{24}$/.test(category);
                        var findcategory;
                        if (categoryIsObjectId) {
                            findcategory = { _id: category };
                        }
                        else {
                            findcategory = await category_model_1.default.findOne({ slug: category }, '_id');
                        }
                        if (findcategory && findcategory._id) {
                            categoryIds.push(findcategory._id);
                            async function fetchCategoryAndChildren(categoryId) {
                                let queue = [categoryId];
                                while (queue.length > 0) {
                                    const currentCategoryId = queue.shift();
                                    const categoriesData = await category_model_1.default.find({ parentCategory: currentCategoryId }, '_id');
                                    const childCategoryIds = categoriesData.map(category => category._id);
                                    queue.push(...childCategoryIds);
                                    categoryIds.push(...childCategoryIds);
                                }
                            }
                            await fetchCategoryAndChildren(findcategory._id);
                        }
                    }
                    query = {
                        ...query, "productCategory.category._id": { $in: categoryIds }
                    };
                }
                if (brands) {
                    const brandArray = brands.split(',');
                    let brandIds = [];
                    let brandSlugs = [];
                    for await (let brand of brandArray) {
                        const brandIsObjectId = /^[0-9a-fA-F]{24}$/.test(brand);
                        if (brandIsObjectId) {
                            brandIds.push(new mongoose_1.default.Types.ObjectId(brand));
                        }
                        else {
                            brandSlugs.push(brand);
                        }
                    }
                    if (brandIds.length > 0) {
                        query = {
                            ...query,
                            "brand._id": { $in: brandIds }
                        };
                    }
                    if (brandSlugs.length > 0) {
                        query = {
                            ...query,
                            "brand.slug": { $in: brandSlugs }
                        };
                    }
                }
                if (brand) {
                    const brandIsObjectId = /^[0-9a-fA-F]{24}$/.test(brand);
                    if (brandIsObjectId) {
                        query = {
                            ...query, "brand._id": new mongoose_1.default.Types.ObjectId(brand)
                        };
                    }
                    else {
                        query = {
                            ...query, "brand.slug": brand
                        };
                    }
                }
                if (attribute) {
                    let attributeDetailIds = [];
                    let attributeDetailNames = [];
                    const attributeArray = attribute.split(',');
                    for await (let attribute of attributeArray) {
                        const attributeIsObjectId = /^[0-9a-fA-F]{24}$/.test(attribute);
                        if (attributeIsObjectId) {
                            attributeDetailIds.push(new mongoose_1.default.Types.ObjectId(attribute));
                        }
                        else {
                            attributeDetailNames.push(attribute);
                        }
                    }
                    if (attributeDetailIds.length > 0) {
                        query = {
                            ...query,
                            "productVariants.productVariantAttributes.attributeDetail._id": { $in: attributeDetailIds }
                        };
                    }
                    if (attributeDetailNames.length > 0) {
                        query = {
                            ...query,
                            "productVariants.productVariantAttributes.attributeDetail.itemName": { $in: attributeDetailNames }
                        };
                    }
                }
                if (specification) {
                    let specificationDetailIds = [];
                    let specificationDetailNames = [];
                    const specificationArray = specification.split(',');
                    for await (let specification of specificationArray) {
                        const isObjectId = /^[0-9a-fA-F]{24}$/.test(specification);
                        if (isObjectId) {
                            specificationDetailIds.push(new mongoose_1.default.Types.ObjectId(specification));
                        }
                        else {
                            specificationDetailNames.push(specification);
                        }
                    }
                    if (specificationDetailIds.length > 0) {
                        query = {
                            ...query,
                            "productVariants.productSpecification.specificationDetail._id": { $in: specificationDetailIds },
                            // "productSpecification.specificationDetail._id": { $in: specificationDetailIds } //  don't remove
                        };
                    }
                    if (specificationDetailNames.length > 0) {
                        query = {
                            ...query,
                            "productVariants.productSpecification.specificationDetail.itemName": { $in: specificationDetailNames },
                            // "productSpecification.specificationDetail.itemName": { $in: specificationDetailNames } //  don't remove
                        };
                    }
                }
                if (collectionproduct) {
                    collectionProductsData = {
                        ...collectionProductsData, collectionproduct: new mongoose_1.default.Types.ObjectId(collectionproduct)
                    };
                }
                if (collectionbrand) {
                    collectionProductsData = {
                        ...collectionProductsData, collectionbrand: new mongoose_1.default.Types.ObjectId(collectionbrand)
                    };
                }
                if (collectioncategory) {
                    collectionProductsData = {
                        ...collectionProductsData, collectioncategory: new mongoose_1.default.Types.ObjectId(collectioncategory)
                    };
                }
                if (offer) {
                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(offer);
                    if (isObjectId) {
                        offers = { _id: new mongoose_1.default.Types.ObjectId(offer) };
                    }
                    else {
                        const keywordRegex = new RegExp(offer, 'i');
                        offers = { slug: keywordRegex };
                    }
                }
                // if (maxprice || minprice) {
                //     query['productVariants.price'] = {};
                //     if (minprice) {
                //         query['productVariants.price'].$gte = Number(minprice);
                //     }
                //     if (maxprice) {
                //         query['productVariants.price'].$lte = Number(maxprice);
                //     }
                // }
                if (discount) {
                    discountValue = {
                        ...discount, discount: discount
                    };
                }
                if (sortby == 'createdAt') {
                    if (sortorder === 'asc') {
                        sort = { createdAt: -1 };
                    }
                    else {
                        sort = { createdAt: 1 };
                    }
                }
                const productData = await product_service_1.default.findProductList({
                    countryId,
                    page: parseInt(page_size),
                    limit: parseInt(limit),
                    query,
                    sort,
                    collectionProductsData,
                    discount,
                    offers,
                    getimagegallery,
                    getattribute,
                    getspecification,
                    hostName: req.get('origin'),
                    maxprice,
                    minprice,
                    isCount: 1
                });
                return controller.sendSuccessResponse(res, {
                    requestedData: productData.products,
                    totalCount: productData.totalCount || 0,
                    message: 'Success!'
                }, 200);
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'Country is missing'
                }, req);
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching specifications' });
        }
    }
    async findProductDetail(req, res) {
        try {
            const productSlug = req.params.slug;
            const variantSku = req.params.sku;
            const { getattribute = '0', getspecification = '0', getimagegallery = '0' } = req.query;
            let query = {};
            if (productSlug) {
                if (variantSku) {
                    query = {
                        ...query, 'productVariants.variantSku': new RegExp(variantSku, 'i')
                    };
                }
                const checkProductIdOrSlug = /^[0-9a-fA-F]{24}$/.test(productSlug);
                const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
                let variantDetails = null;
                if (checkProductIdOrSlug) {
                    query = {
                        ...query,
                        'productVariants._id': new mongoose_1.default.Types.ObjectId(productSlug),
                    };
                }
                else {
                    query = {
                        ...query,
                        'productVariants.slug': productSlug,
                    };
                }
                const productDetails = await product_service_1.default.findProductList({
                    countryId,
                    query,
                    getattribute,
                    hostName: req.get('origin'),
                });
                if (productDetails && productDetails.length === 0) {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Product not found!',
                    });
                }
                if (productDetails[0].productVariants && productDetails[0].productVariants.length === 0) {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Product variant not found!',
                    });
                }
                variantDetails = productDetails[0].productVariants[0];
                if (!variantDetails) {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Product not found!',
                    });
                }
                let imageGallery = await product_gallery_images_model_1.default.find({
                    variantId: variantDetails._id
                }).select('-createdAt -statusAt -status').sort({ _id: 1 });
                if (!imageGallery?.length) { // Check if imageGallery is empty
                    imageGallery = await product_gallery_images_model_1.default.find({ productID: variantDetails.productId, variantId: null }).select('-createdAt -statusAt -status').sort({ _id: 1 });
                }
                let productSpecification = [];
                if (getspecification === '1') {
                    productSpecification = await product_specification_model_1.default.aggregate((0, specification_config_1.frontendSpecificationLookup)({
                        variantId: variantDetails._id
                    }));
                    if (!productSpecification?.length) {
                        productSpecification = await product_specification_model_1.default.aggregate((0, specification_config_1.frontendSpecificationLookup)({
                            productId: variantDetails.productId,
                            variantId: null
                        }));
                    }
                }
                let allProductVariantAttributes = [];
                let allProductVariants = [];
                if (getattribute === '1') {
                    allProductVariants = await product_variants_model_1.default.find({
                        productId: variantDetails.productId,
                        countryId
                    }).select('_id productId variantSku slug isDefault quantity').exec();
                    if (allProductVariants && allProductVariants.length > 0) {
                        allProductVariantAttributes = await product_variant_attribute_model_1.default.aggregate((0, attribute_config_1.frontendVariantAttributesLookup)({
                            variantId: { $in: allProductVariants.map((variant) => variant._id) }
                        }));
                    }
                }
                return controller.sendSuccessResponse(res, {
                    requestedData: {
                        product: {
                            ...productDetails[0],
                            allProductVariants,
                            allProductVariantAttributes,
                            imageGallery: imageGallery || [],
                            productSpecification: productSpecification || [],
                        },
                        reviews: []
                    },
                    message: 'Success'
                });
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Products Id not found!',
                });
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
    async findAllProductVariantsListWithBasicDetails(req, res) {
        try {
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            const allProducts = await product_variants_model_1.default.find({ countryId });
            return controller.sendSuccessResponse(res, {
                requestedData: allProducts,
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'An error occurred while retrieving product specifications',
            });
        }
    }
    async findProductDetailSpecification(req, res) {
        try {
            const variantSlugOrId = req.params.slug;
            if (!variantSlugOrId) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Product ID or slug is required!',
                });
            }
            const isObjectId = mongoose_1.default.Types.ObjectId.isValid(variantSlugOrId);
            const variantDetails = isObjectId
                ? await product_variants_model_1.default.findOne({ _id: variantSlugOrId }).lean()
                : await product_variants_model_1.default.findOne({ slug: variantSlugOrId }).lean();
            if (!variantDetails) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Product variant not found!',
                });
            }
            let productSpecifications = await product_specification_model_1.default.aggregate((0, specification_config_1.frontendSpecificationLookup)({
                variantId: variantDetails._id
            }));
            if (!productSpecifications.length) {
                productSpecifications = await product_specification_model_1.default.aggregate((0, specification_config_1.frontendSpecificationLookup)({
                    productId: variantDetails.productId,
                    variantId: null
                }));
            }
            return controller.sendSuccessResponse(res, {
                requestedData: productSpecifications,
                message: 'Success'
            });
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'An error occurred while retrieving product specifications',
            });
        }
    }
    async findProductDetailSeo(req, res) {
        try {
            const productId = req.params.slug;
            const variantSku = req.params.sku;
            if (!productId) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Product Id not found!',
                });
            }
            const checkProductIdOrSlug = /^[0-9a-fA-F]{24}$/.test(productId);
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            let variantDetails = null;
            if (checkProductIdOrSlug) {
                variantDetails = await product_variants_model_1.default.findOne({
                    _id: new mongoose_1.default.Types.ObjectId(productId),
                    countryId
                });
            }
            else {
                variantDetails = await product_variants_model_1.default.findOne({
                    slug: productId,
                    countryId
                });
            }
            if (!variantDetails) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Product not found!',
                });
            }
            let seoDetails = null;
            if (variantDetails.id) {
                seoDetails = await seo_page_model_1.default.findOne({
                    pageReferenceId: variantDetails.id
                }).select('-pageId -page -pageReferenceId');
            }
            if (!seoDetails) {
                seoDetails = await seo_page_model_1.default.findOne({
                    pageId: variantDetails.productId
                }).select('-pageId -page');
            }
            const productDetails = await product_model_1.default.findOne({
                _id: variantDetails.productId
            }).select('_id productTitle slug description productImageUrl');
            if (!productDetails) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Product details not found!',
                });
            }
            return controller.sendSuccessResponse(res, {
                requestedData: {
                    ...productDetails.toObject(),
                    ...seoDetails?.toObject()
                },
                message: 'Success'
            });
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
    async findAllAttributes(req, res) {
        try {
            const { category = '', brand = '', collectionproduct = '', collectionbrand = '', collectioncategory = '' } = req.query;
            let query = { _id: { $exists: true } };
            let collectionId;
            query.status = '1';
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                if (category) {
                    const categoryIsObjectId = /^[0-9a-fA-F]{24}$/.test(category);
                    var findcategory;
                    if (categoryIsObjectId) {
                        findcategory = { _id: category };
                    }
                    else {
                        findcategory = await category_model_1.default.findOne({ slug: category }, '_id');
                    }
                    if (findcategory && findcategory._id) {
                        let categoryIds = [findcategory._id];
                        async function fetchCategoryAndChildren(categoryId) {
                            let queue = [categoryId];
                            while (queue.length > 0) {
                                const currentCategoryId = queue.shift();
                                const categoriesData = await category_model_1.default.find({ parentCategory: currentCategoryId }, '_id');
                                const childCategoryIds = categoriesData.map(category => category._id);
                                queue.push(...childCategoryIds);
                                categoryIds.push(...childCategoryIds);
                            }
                        }
                        await fetchCategoryAndChildren(findcategory._id);
                        query = {
                            ...query, "productCategory.category._id": { $in: categoryIds }
                        };
                    }
                }
                if (brand) {
                    const keywordRegex = new RegExp(brand, 'i');
                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(brand);
                    if (isObjectId) {
                        query = {
                            ...query, "brand": new mongoose_1.default.Types.ObjectId(brand)
                        };
                    }
                    else {
                        const brandData = await brands_model_1.default.findOne({ slug: keywordRegex }).select('_id');
                        if (brandData) {
                            query = {
                                ...query, "brand": brandData?._id
                            };
                        }
                    }
                }
                if (collectionproduct) {
                    collectionId = {
                        ...collectionId, collectionproduct: new mongoose_1.default.Types.ObjectId(collectionproduct)
                    };
                }
                if (collectionbrand) {
                    collectionId = {
                        ...collectionId, collectionbrand: new mongoose_1.default.Types.ObjectId(collectionbrand)
                    };
                }
                if (collectioncategory) {
                    collectionId = {
                        ...collectionId, collectioncategory: new mongoose_1.default.Types.ObjectId(collectioncategory)
                    };
                }
                const attributes = await product_service_1.default.findAllAttributes({
                    hostName: req.get('origin'),
                    query,
                    collectionId,
                });
                attributes.sort((a, b) => {
                    const titleA = a.attributeTitle.toLowerCase();
                    const titleB = b.attributeTitle.toLowerCase();
                    if (titleA < titleB) {
                        return -1;
                    }
                    if (titleA > titleB) {
                        return 1;
                    }
                    return 0;
                });
                return controller.sendSuccessResponse(res, {
                    requestedData: attributes,
                    message: 'Success!'
                }, 200);
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'Country is missing'
                }, req);
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching attributes' });
        }
    }
    async findAllSpecifications(req, res) {
        try {
            const { category = '', brand = '', collectionproduct = '', collectionbrand = '', collectioncategory = '' } = req.query;
            let query = { _id: { $exists: true } };
            let collectionId;
            query.status = '1';
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                if (category) {
                    const categoryIsObjectId = /^[0-9a-fA-F]{24}$/.test(category);
                    var findcategory;
                    if (categoryIsObjectId) {
                        findcategory = { _id: category };
                    }
                    else {
                        findcategory = await category_model_1.default.findOne({ slug: category }, '_id');
                    }
                    if (findcategory && findcategory._id) {
                        let categoryIds = [findcategory._id];
                        async function fetchCategoryAndChildren(categoryId) {
                            let queue = [categoryId];
                            while (queue.length > 0) {
                                const currentCategoryId = queue.shift();
                                const categoriesData = await category_model_1.default.find({ parentCategory: currentCategoryId }, '_id');
                                const childCategoryIds = categoriesData.map(category => category._id);
                                queue.push(...childCategoryIds);
                                categoryIds.push(...childCategoryIds);
                            }
                        }
                        await fetchCategoryAndChildren(findcategory._id);
                        query = {
                            ...query, "productCategory.category._id": { $in: categoryIds }
                        };
                    }
                    else {
                        query = {
                            ...query, "productCategory.category._id": new mongoose_1.default.Types.ObjectId(category)
                        };
                    }
                }
                if (brand) {
                    const keywordRegex = new RegExp(brand, 'i');
                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(brand);
                    if (isObjectId) {
                        query = {
                            ...query, "brand": new mongoose_1.default.Types.ObjectId(brand)
                        };
                    }
                    else {
                        const brandData = await brands_model_1.default.findOne({ slug: keywordRegex }).select('_id');
                        if (brandData) {
                            query = {
                                ...query, "brand": brandData?._id
                            };
                        }
                    }
                }
                if (collectionproduct) {
                    collectionId = {
                        ...collectionId, collectionproduct: new mongoose_1.default.Types.ObjectId(collectionproduct)
                    };
                }
                if (collectionbrand) {
                    collectionId = {
                        ...collectionId, collectionbrand: new mongoose_1.default.Types.ObjectId(collectionbrand)
                    };
                }
                if (collectioncategory) {
                    collectionId = {
                        ...collectionId, collectioncategory: new mongoose_1.default.Types.ObjectId(collectioncategory)
                    };
                }
                const specifications = await product_service_1.default.findAllSpecifications({
                    hostName: req.get('origin'),
                    query,
                    collectionId,
                });
                return controller.sendSuccessResponse(res, {
                    requestedData: specifications,
                    message: 'Success!'
                }, 200);
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'Country is missing'
                }, req);
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching specifications' });
        }
    }
    async youMayLikeAlso(req, res) {
        const { getbrand = '0', getattribute = '', getspecification = '', page_size = 1, limit = 30, } = req.query;
        const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
        if (!countryId) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Error',
                validation: 'Country is missing'
            }, req);
        }
        const customerId = res.locals.user || null;
        const guestUserId = res.locals.uuid || null;
        const searchQueryFilter = {
            $or: [
                { customerId },
                { guestUserId }
            ]
        };
        const searchQueries = await search_query_model_1.default.find(searchQueryFilter);
        let keywords = searchQueries.map(query => query.searchQuery).filter(Boolean);
        if (keywords.length === 0) {
            const topSearchQueries = await search_query_model_1.default.find().sort({ searchCount: -1 }).limit(10).exec();
            if (topSearchQueries.length === 0) {
                const randomProducts = await product_service_1.default.findProductList({
                    countryId,
                    query: { _id: { $exists: true } },
                    getattribute,
                    getspecification,
                    getbrand,
                    page: 1,
                    limit: parseInt(limit),
                    hostName: req.get('origin'),
                });
                return controller.sendSuccessResponse(res, {
                    requestedData: randomProducts,
                    message: 'No search queries or frequent queries found. Here are some random products!'
                }, 200);
            }
            keywords = topSearchQueries.map(query => query.searchQuery).filter(Boolean);
            if (keywords.length === 0) {
                const randomProducts = await product_service_1.default.findProductList({
                    countryId,
                    query: { _id: { $exists: true } },
                    getattribute,
                    getspecification,
                    getbrand,
                    page: 1,
                    limit: parseInt(limit),
                    hostName: req.get('origin'),
                });
                return controller.sendSuccessResponse(res, {
                    requestedData: randomProducts,
                    message: 'No valid search queries available. Here are some random products!'
                }, 200);
            }
        }
        const keywordRegex = new RegExp(keywords.join('|'), 'i');
        const productQuery = {
            _id: { $exists: true },
            $or: [
                { productTitle: keywordRegex },
                { 'productCategory.category.categoryTitle': keywordRegex },
                { 'brand.brandTitle': keywordRegex },
                { 'productCategory.category.slug': keywordRegex },
                { 'productVariants.extraProductTitle': keywordRegex },
            ],
            status: '1'
        };
        const productData = await product_service_1.default.findProductList({
            countryId,
            query: productQuery,
            getattribute,
            getspecification,
            getbrand,
            page: parseInt(page_size),
            limit: parseInt(limit),
            hostName: req.get('origin'),
        });
        return controller.sendSuccessResponse(res, {
            requestedData: productData,
            message: 'Success!'
        }, 200);
    }
    async relatedProducts(req, res) {
        const { categories = '', getattribute = '', getspecification = '', page_size = 1, limit = 30, } = req.query;
        let query = { _id: { $exists: true } };
        if (!categories) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Error',
                validation: 'Category id is rquired'
            }, req);
        }
        const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
        if (!countryId) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Error',
                validation: 'Country is missing'
            }, req);
        }
        const categoryArray = categories.split(',');
        let categoryIds = [];
        let categorySlugs = [];
        for (const category of categoryArray) {
            const categoryIsObjectId = /^[0-9a-fA-F]{24}$/.test(category);
            if (categoryIsObjectId) {
                categoryIds.push(new mongoose_1.default.Types.ObjectId(category));
            }
            else {
                categorySlugs.push(category);
            }
        }
        const categoryQuery = {};
        if (categoryIds.length > 0) {
            categoryQuery["productCategory.category._id"] = { $in: categoryIds };
        }
        if (categorySlugs.length > 0) {
            categoryQuery["productCategory.category.slug"] = { $in: categorySlugs };
        }
        query = {
            ...query,
            ...categoryQuery,
            status: '1'
        };
        const productData = await product_service_1.default.findProductList({
            countryId,
            query,
            getattribute,
            getspecification,
            getbrand: '0',
            page: parseInt(page_size),
            limit: parseInt(limit),
            hostName: req.get('origin'),
        });
        return controller.sendSuccessResponse(res, {
            requestedData: productData,
            message: 'Success!'
        }, 200);
    }
    async getSearchSuggestions(req, res) {
        try {
            const { query = '' } = req.query;
            let results = null;
            if (query) {
                const searchQuery = query;
                const productsPromise = product_model_1.default.aggregate(search_suggestion_config_1.searchSuggestionProductsLookup).exec();
                const brandsPromise = brands_model_1.default.aggregate(search_suggestion_config_1.searchSuggestionBrandsLookup).exec();
                const categoriesPromise = category_model_1.default.aggregate(search_suggestion_config_1.searchSuggestionCategoryLookup).exec();
                const [products, brands, categories] = await Promise.all([
                    productsPromise,
                    brandsPromise,
                    categoriesPromise,
                ]);
                const fuseProducts = new fuse_js_1.default(products, {
                    keys: ['productTitle'],
                    includeScore: true,
                    threshold: 0.3
                });
                const fuseBrands = new fuse_js_1.default(brands, {
                    keys: ['brandTitle'],
                    includeScore: true,
                    threshold: 0.4
                });
                const fuseCategories = new fuse_js_1.default(categories, {
                    keys: ['categoryTitle'],
                    includeScore: true,
                    threshold: 0.4
                });
                const productResults = fuseProducts.search(searchQuery).map(result => result.item);
                const brandResults = fuseBrands.search(searchQuery).map(result => result.item);
                const categoryResults = fuseCategories.search(searchQuery).map(result => result.item);
                const uniqueTitles = new Set();
                const deduplicate = (results) => {
                    return results.filter(item => {
                        const title = item.productTitle || item.brandTitle || item.categoryTitle;
                        if (uniqueTitles.has(title)) {
                            return false;
                        }
                        uniqueTitles.add(title);
                        return true;
                    });
                };
                const limitResults = (results, limit) => {
                    return results?.slice(0, limit);
                };
                results = {
                    brands: limitResults(deduplicate(brandResults), 10),
                    categories: limitResults(deduplicate(categoryResults), brandResults?.length > 10 ? 10 : 15),
                    products: limitResults(deduplicate(productResults), brandResults?.length > 10 ? (categoryResults?.length > 10 ? 10 : 15) : 15),
                };
            }
            if (query === '') {
                const origin = req.get('origin');
                const countryId = await common_service_1.default.findOneCountrySubDomainWithId(origin);
                const dataFetchers = [
                    {
                        key: 'topSearches',
                        promise: search_query_model_1.default.aggregate(search_suggestion_config_1.topSearchesLookup).exec(),
                    },
                    {
                        key: 'collectionProducts',
                        promise: common_service_1.default.findCollectionProducts({
                            hostName: origin,
                            query: { _id: { $exists: true }, page: pages_1.pagesJson.search, countryId },
                            getspecification: '0',
                            getattribute: '0',
                        }),
                    },
                    {
                        key: 'collectionCategories',
                        promise: common_service_1.default.findCollectionCategories({
                            hostName: origin,
                            query: { _id: { $exists: true }, page: pages_1.pagesJson.search, countryId },
                        }),
                    },
                    {
                        key: 'collectionBrands',
                        promise: common_service_1.default.findCollectionBrands({
                            hostName: origin,
                            query: { _id: { $exists: true }, page: pages_1.pagesJson.search, countryId },
                        }),
                    },
                ];
                for (const { key, promise } of dataFetchers) {
                    const data = await promise;
                    if (data.length > 0) {
                        results = { ...results, [key]: data };
                    }
                }
            }
            return controller.sendSuccessResponse(res, {
                requestedData: results,
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            console.error('Search Error:', error);
            return controller.sendErrorResponse(res, 500, {
                message: 'An error occurred while performing the search.',
                validation: 'Search query failed'
            }, req);
        }
    }
}
exports.default = new ProductController();

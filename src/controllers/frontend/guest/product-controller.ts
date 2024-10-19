import mongoose from 'mongoose';
import { Request, Response } from 'express';
import Fuse from 'fuse.js';

import { pagesJson } from '../../../constants/pages';
import { frontendSpecificationLookup } from '../../../utils/config/specification-config';
import { ProductsFrontendQueryParams } from '../../../utils/types/products';
import { frontendVariantAttributesLookup } from '../../../utils/config/attribute-config';
import { searchSuggestionBrandsLookup, searchSuggestionCategoryLookup, searchSuggestionProductsLookup, topSearchesLookup } from '../../../utils/config/search-suggestion-config';

import BaseController from '../../admin/base-controller';
import ProductService from '../../../services/frontend/guest/product-service'
import CommonService from '../../../services/frontend/guest/common-service';
import CategoryModel from '../../../model/admin/ecommerce/category-model';
import ProductVariantsModel from '../../../model/admin/ecommerce/product/product-variants-model';
import ProductsModel from '../../../model/admin/ecommerce/product-model';
import SeoPageModel from '../../../model/admin/seo-page-model';
import ProductGalleryImagesModel from '../../../model/admin/ecommerce/product/product-gallery-images-model';
import ProductSpecificationModel from '../../../model/admin/ecommerce/product/product-specification-model';
import BrandsModel from '../../../model/admin/ecommerce/brands-model';
import ProductVariantAttributesModel from '../../../model/admin/ecommerce/product/product-variant-attribute-model';
import SearchQueriesModel from '../../../model/frontend/search-query-model';
import ProductCategoryLinkModel from '../../../model/admin/ecommerce/product/product-category-link-model';
import AttributeDetailModel from '../../../model/admin/ecommerce/attribute-detail-model';
import SpecificationDetailModel from '../../../model/admin/ecommerce/specifications-detail-model';

const controller = new BaseController();
class ProductController extends BaseController {

    async findAllVariantProductsV1(req: any, res: Response): Promise<void> {
        const { page_size = 1, limit = 20, keyword = '', getbrand = '0', category = '', brand = '', collectionproduct = '', collectionbrand = '', collectioncategory = '', getimagegallery = 0, categories = '', brands = '', attribute = '', specification = '', offer = '', sortby = '', sortorder = '', maxprice = '', minprice = '', discount = '', getattribute = '', getdiscount = '', getfilterattributes = '', getspecification = '' } = req.query as ProductsFrontendQueryParams;
        let query: any = { 'productDetails.status': "1" };
        let collectionProductsData: any = null;
        let discountValue: any;
        let offers: any;

        const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
        if (!countryId) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Error',
                validation: 'Country is missing'
            }, req);
        }
        let sort: any = {};
        let keywordRegex: RegExp | undefined = undefined;
        let keywordRegexSingle: RegExp | undefined = undefined;
        let productIds: any[] = [];
        let productFindableValues: any = {
            matchProductIds: []
        }
        if (sortby && sortorder) {
            sort[sortby] = sortorder === 'desc' ? -1 : 1;
        }
        if (!brand && !category && keyword) {
            keywordRegex = new RegExp(`${keyword}`, 'i');
            const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            keywordRegexSingle = new RegExp(`\\b${escapedKeyword}`, 'i');
            const brandByTitleId = await BrandsModel.find({
                $or: [
                    { brandTitle: { $regex: keywordRegex } },
                    { slug: { $regex: keywordRegex } }
                ]
            }, '_id');
            query = {
                ...query,
                $or: [
                    { 'productDetails.productTitle': { $regex: keywordRegexSingle } },
                    { 'extraProductTitle': { $regex: keywordRegexSingle } },
                    { slug: { $regex: new RegExp(`^${keyword}`, 'i') } },
                    { 'variantSku': { $regex: new RegExp(`^${keyword}`, 'i') } },
                    ...(brandByTitleId.length > 0 ? [{ 'productDetails.brand': { $in: brandByTitleId.map(brand => brand._id) } }] : []),
                ],
            } as any;

            if (page_size === 1 && typeof keyword === 'string' && keyword.trim() !== '' && keyword.trim().length > 2 && keyword !== 'undefined' && keyword !== 'null' && keyword !== null && !Number.isNaN(Number(keyword)) && keyword !== false.toString()) {
                const customer = null;
                const guestUser = res.locals.uuid || null;

                await ProductService.insertOrUpdateSearchQuery(
                    keyword,
                    countryId,
                    customer ? new mongoose.Types.ObjectId(customer) : null,
                    guestUser
                );
            }
        }
        async function fetchAllCategories(categoryIds: any[]): Promise<any[]> {
            let queue = [...categoryIds];
            const allCategoryIds = new Set([...categoryIds]);
            while (queue.length > 0) {
                const categoriesData = await CategoryModel.find(
                    { parentCategory: { $in: queue } },
                    '_id'
                );
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
            let categoryBatchIds: any[] = [];
            const fetchCategoryId = async (categoryValue: string) => {
                const isObjectId = /^[0-9a-fA-F]{24}$/.test(categoryValue);
                return isObjectId ? categoryValue : (await CategoryModel.findOne({ slug: categoryValue }, '_id'))?._id || null;
            };
            if (!categories && category) {
                const categoryId = await fetchCategoryId(category);
                if (categoryId) {
                    categoryBatchIds.push(categoryId)
                }
            }
            if (categories) {
                const categoryArray = Array.isArray(categories) ? categories : categories.split(',');
                const categoryIds = await Promise.all(categoryArray.map(fetchCategoryId));
                if (!keyword) {
                    categoryBatchIds = categoryIds.filter(Boolean)
                } else {
                    categoryBatchIds.push(...categoryIds.filter(Boolean));
                }
            }
            const categoryIds = await fetchAllCategories([...new Set(categoryBatchIds)]);
            if (categoryIds.length > 0) {
                query = {
                    ...query, "productCategory.categoryId": { $in: categoryIds }
                }
            }
        }

        if (brands || brand || keyword) {
            let brandIds: any[] = [];
            let brandSlugs: string[] = [];
            const processBrand = async (brandValue: string) => {
                const isObjectId = /^[0-9a-fA-F]{24}$/.test(brandValue);
                if (isObjectId) {
                    brandIds.push(new mongoose.Types.ObjectId(brandValue));
                } else {
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
            if (brandSlugs.length > 0 || brandIds.length > 0) {
                const foundBrands = await BrandsModel.find({ slug: { $in: brandSlugs } }, '_id');
                if (foundBrands && foundBrands.length > 0) {
                    query = {
                        ...query, "productDetails.brand": { $in: [...new Set([...brandIds, ...foundBrands.map(brand => brand._id)])] },
                    }

                }
            }
        }

        if (attribute || keyword) {
            let attributeDetailIds: mongoose.Types.ObjectId[] = [];
            let attributeDetailNames: string[] = [];
            const attributeArray = attribute ? attribute.split(',') : [];
            for (let attr of attributeArray) {
                const isObjectId = /^[0-9a-fA-F]{24}$/.test(attr);
                if (isObjectId) {
                    attributeDetailIds.push(new mongoose.Types.ObjectId(attr));
                } else {
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
                const attributeDetailsQuery: any = {
                    $or: []
                };
                if (attributeDetailNames.length > 0) {
                    attributeDetailsQuery.$or.push({ itemName: { $in: attributeDetailNames } });
                }
                if (keywordRegexSingle) {
                    attributeDetailsQuery.$or.push({ itemName: { $regex: `${keywordRegexSingle}` } });
                }
                if (attributeDetailsQuery.$or.length > 0) {
                    const attributeDetails = await AttributeDetailModel.find(attributeDetailsQuery, '_id attributeId itemName itemValue');
                    if (attributeDetails.length > 0) {
                        const attributeProductIds = await ProductVariantAttributesModel.aggregate([
                            {
                                $match: {
                                    attributeDetailId: { $in: attributeDetails.map((detail: any) => detail._id) },
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
                        productIds = [...new Set([...productIds, ...attributeProductIds.map((p: any) => p.productId)])];
                    }
                }
            }
        }

        if (specification || keyword) {
            let specificationDetailIds: mongoose.Types.ObjectId[] = [];
            let specificationDetailNames: string[] = [];
            const specificationArray = specification ? specification.split(',') : [];
            for (let spec of specificationArray) {
                const isObjectId = /^[0-9a-fA-F]{24}$/.test(spec);
                if (isObjectId) {
                    specificationDetailIds.push(new mongoose.Types.ObjectId(spec));
                } else {
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
                const specificationDetailsQuery: any = { $or: [] };
                if (specificationDetailNames.length > 0) {
                    specificationDetailsQuery.$or.push({ itemName: { $in: specificationDetailNames } });
                }
                if (keywordRegexSingle) {
                    specificationDetailsQuery.$or.push({ itemName: { $regex: `${keywordRegexSingle}` } });
                }
                if (specificationDetailsQuery.$or.length > 0) {
                    const specificationDetails = await SpecificationDetailModel.find(specificationDetailsQuery, '_id specificationId itemName itemValue');
                    if (specificationDetails.length > 0) {
                        const specificationProductIds = await ProductSpecificationModel.aggregate([
                            {
                                $match: {
                                    specificationDetailId: { $in: specificationDetails.map((detail: any) => detail._id) },
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
                        productIds = [...new Set([...productIds, ...specificationProductIds.map((p: any) => p.productId)])];
                    }
                }
            }
        }
        if (collectionproduct) {
            collectionProductsData = {
                ...collectionProductsData, collectionproduct: new mongoose.Types.ObjectId(collectionproduct)
            }
            productFindableValues = {
                ...productFindableValues,
                collectionProductsData: {
                    collectionproduct: new mongoose.Types.ObjectId(collectionproduct)
                }
            };
        }
        if (collectionbrand) {
            collectionProductsData = {
                ...collectionProductsData, collectionbrand: new mongoose.Types.ObjectId(collectionbrand)
            }
            productFindableValues = {
                ...productFindableValues,
                collectionProductsData: {
                    ...(productFindableValues.collectionProductsData || {}),
                    collectionbrand: new mongoose.Types.ObjectId(collectionbrand)
                }
            };
        }

        if (collectioncategory) {
            collectionProductsData = {
                ...collectionProductsData, collectioncategory: new mongoose.Types.ObjectId(collectioncategory)
            }
            productFindableValues = {
                ...productFindableValues,
                collectionProductsData: {
                    ...(productFindableValues.collectionProductsData || {}),
                    collectioncategory: new mongoose.Types.ObjectId(collectioncategory)
                }
            };
        }
        // if (Object.keys(brandFilter).length > 0 && Object.keys(keywordSearch).length > 0) {
        //     console.log('brandFilter', brandFilter, keywordSearch);
        //     if (keywordSearch?.$or) {
        //         keywordSearch.$or.push(brandFilter)
        //     }
        //     query = {
        //         ...query,
        //         $or: [
        //             keywordSearch
        //         ]
        //     };
        // } else if (Object.keys(brandFilter).length > 0) {
        //     query = {
        //         ...query,
        //         $or: [
        //             brandFilter
        //         ]
        //     };
        // } else if (Object.keys(keywordSearch).length > 0) {
        //     query = {
        //         ...query,
        //         $or: [
        //             keywordSearch
        //         ]
        //     };
        // }

        // if (productIds.length > 0) {
        //     if (query.$or) {
        //         query.$or.push({ productId: { $in: productIds } });
        //     } else {
        //         query.$or = [{ productId: { $in: productIds } }];
        //     }
        // }

        const productDatas = await ProductService.getProductVariantDetailsV1(productFindableValues, {
            countryId,
            page: parseInt(page_size as string),
            limit: parseInt(limit as string),
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

    async findAllProductsV2(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 20, keyword = '', getbrand = '0', category = '', brand = '', collectionproduct = '', collectionbrand = '', collectioncategory = '', getimagegallery = 0, categories = '', brands = '', attribute = '', specification = '', offer = '', sortby = '', sortorder = '', maxprice = '', minprice = '', discount = '', getattribute = '', getspecification = '' } = req.query as ProductsFrontendQueryParams;
            let query: any = { _id: { $exists: true } };
            let collectionProductsData: any = null;
            let discountValue: any;
            let offers: any;
            query.status = '1';
            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));

            if (countryId) {
                let sort: any = {};
                let keywordRegex: RegExp | undefined = undefined;
                let keywordRegexSingle: RegExp | undefined = undefined;
                let productIds: any[] = [];
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
                    } as any;
                    const keywordProductIds = await ProductsModel.aggregate([
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
                        productIds = [...new Set(keywordProductIds.map((id: any) => id._id))]
                    }
                    const keywordVariantProductIds = await ProductVariantsModel.aggregate([
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
                        productIds = [...new Set(keywordVariantProductIds.map((id: any) => id.productId))]
                    }

                    if (page_size === 1 && typeof keyword === 'string' && keyword.trim() !== '' && keyword.trim().length > 2 && keyword !== 'undefined' && keyword !== 'null' && keyword !== null && !Number.isNaN(Number(keyword)) && keyword !== false.toString()) {
                        const customer = null;
                        const guestUser = res.locals.uuid || null;

                        await ProductService.insertOrUpdateSearchQuery(
                            keyword,
                            countryId,
                            customer ? new mongoose.Types.ObjectId(customer) : null,
                            guestUser
                        );
                    }
                }
                async function fetchAllCategories(categoryIds: any[]): Promise<any[]> {
                    let queue = [...categoryIds];
                    const allCategoryIds = new Set([...categoryIds]);
                    while (queue.length > 0) {
                        const categoriesData = await CategoryModel.find(
                            { parentCategory: { $in: queue } },
                            '_id'
                        );
                        const childCategoryIds = categoriesData.map(category => category._id);
                        if (childCategoryIds.length === 0) {
                            break;
                        }
                        queue = childCategoryIds;
                        childCategoryIds.forEach(id => allCategoryIds.add(id));
                    }
                    return Array.from(allCategoryIds);
                }
                let productFindableValues: any = {}
                if (category || categories || keyword) {
                    let categoryBatchIds: any[] = [];
                    const fetchCategoryId = async (categoryValue: string) => {
                        const isObjectId = /^[0-9a-fA-F]{24}$/.test(categoryValue);
                        return isObjectId ? categoryValue : (await CategoryModel.findOne({ slug: categoryValue }, '_id'))?._id || null;
                    };
                    if (!categories && category) {
                        const categoryId = await fetchCategoryId(category);
                        if (categoryId) {
                            categoryBatchIds.push(categoryId)
                        }
                    } else if (keyword) {
                        const categoriesByTitle = await CategoryModel.find({ categoryTitle: { $regex: keywordRegexSingle } }, '_id');
                        categoryBatchIds.push(...categoriesByTitle.map(category => category._id));
                    }
                    if (categories) {
                        const categoryArray = Array.isArray(categories) ? categories : categories.split(',');
                        const categoryIds = await Promise.all(categoryArray.map(fetchCategoryId));
                        if (!keyword) {
                            categoryBatchIds = categoryIds.filter(Boolean)
                        } else {
                            categoryBatchIds.push(...categoryIds.filter(Boolean));
                        }
                    }

                    const categoryIds = await fetchAllCategories([...new Set(categoryBatchIds)]);
                    if (categoryIds.length > 0) {
                        const categoryProductIds = await ProductCategoryLinkModel.distinct('productId', { categoryId: { $in: categoryIds } });
                        productIds = [...new Set(categoryProductIds)]
                        productFindableValues = {
                            ...productFindableValues,
                            categoryProductIds: productIds,
                            categoryIds
                        };
                    }
                }

                if (brands || brand || keyword) {
                    let brandIds: any[] = [];
                    let brandSlugs: string[] = [];
                    const processBrand = async (brandValue: string) => {
                        const isObjectId = /^[0-9a-fA-F]{24}$/.test(brandValue);
                        if (isObjectId) {
                            brandIds.push(new mongoose.Types.ObjectId(brandValue));
                        } else {
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
                        const brandByTitleId = await BrandsModel.find({ brandTitle: { $regex: keywordRegexSingle } }, '_id');
                        if (brandByTitleId && brandByTitleId.length > 0) {
                            if (query.$or) {
                                query.$or = [
                                    ...query.$or,
                                    { brand: { $in: brandByTitleId.map(brand => brand._id) } },
                                ];
                            } else {
                                query.$or = [
                                    { brand: { $in: brandByTitleId.map(brand => brand._id) } },
                                ];
                            }
                        }
                        brandIds.push(...brandByTitleId.map(brand => brand._id));
                    }
                    if (brandSlugs.length > 0) {
                        const foundBrands = await BrandsModel.find({ slug: { $in: brandSlugs } }, '_id');
                        brandIds.push(...foundBrands.map(brand => brand._id));
                    }

                    if (brand) {
                        query = {
                            ...query, "brand": { $in: brandIds }
                        };
                    } else if (brandIds.length > 0) {
                        query = {
                            ...query, "brand": { $in: brandIds },
                        }
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
                    let attributeDetailIds: mongoose.Types.ObjectId[] = [];
                    let attributeDetailNames: string[] = [];
                    const attributeArray = attribute ? attribute.split(',') : [];
                    for (let attr of attributeArray) {
                        const isObjectId = /^[0-9a-fA-F]{24}$/.test(attr);
                        if (isObjectId) {
                            attributeDetailIds.push(new mongoose.Types.ObjectId(attr));
                        } else {
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
                        const attributeDetailsQuery: any = {
                            $or: []
                        };
                        if (attributeDetailNames.length > 0) {
                            attributeDetailsQuery.$or.push({ itemName: { $in: attributeDetailNames } });
                        }
                        if (keywordRegexSingle) {
                            attributeDetailsQuery.$or.push({ itemName: { $regex: keywordRegexSingle } });
                        }
                        if (attributeDetailsQuery.$or.length > 0) {
                            const attributeDetails = await AttributeDetailModel.find(attributeDetailsQuery, '_id attributeId itemName itemValue');
                            if (attributeDetails.length > 0) {
                                const attributeProductIds = await ProductVariantAttributesModel.aggregate([
                                    {
                                        $match: {
                                            attributeDetailId: { $in: attributeDetails.map((detail: any) => detail._id) },
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
                                productIds = [...new Set([...productIds, ...attributeProductIds.map((p: any) => p.productId)])];
                            }
                        }
                    }
                }

                if (specification || keyword) {
                    let specificationDetailIds: mongoose.Types.ObjectId[] = [];
                    let specificationDetailNames: string[] = [];
                    const specificationArray = specification ? specification.split(',') : [];
                    for (let spec of specificationArray) {
                        const isObjectId = /^[0-9a-fA-F]{24}$/.test(spec);
                        if (isObjectId) {
                            specificationDetailIds.push(new mongoose.Types.ObjectId(spec));
                        } else {
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
                        const specificationDetailsQuery: any = { $or: [] };
                        if (specificationDetailNames.length > 0) {
                            specificationDetailsQuery.$or.push({ itemName: { $in: specificationDetailNames } });
                        }
                        if (keywordRegexSingle) {
                            specificationDetailsQuery.$or.push({ itemName: { $regex: keywordRegexSingle } });
                        }
                        if (specificationDetailsQuery.$or.length > 0) {
                            const specificationDetails = await SpecificationDetailModel.find(specificationDetailsQuery, '_id specificationId itemName itemValue');
                            if (specificationDetails.length > 0) {
                                const specificationProductIds = await ProductSpecificationModel.aggregate([
                                    {
                                        $match: {
                                            specificationDetailId: { $in: specificationDetails.map((detail: any) => detail._id) },
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
                                productIds = [...new Set([...productIds, ...specificationProductIds.map((p: any) => p.productId)])];
                            }
                        }
                    }
                }

                if (collectionproduct) {
                    collectionProductsData = {
                        ...collectionProductsData, collectionproduct: new mongoose.Types.ObjectId(collectionproduct)
                    }
                    productFindableValues = {
                        ...productFindableValues,
                        collectionProductsData: {
                            collectionproduct: new mongoose.Types.ObjectId(collectionproduct)
                        }
                    };
                }
                if (collectionbrand) {
                    collectionProductsData = {
                        ...collectionProductsData, collectionbrand: new mongoose.Types.ObjectId(collectionbrand)
                    }
                    productFindableValues = {
                        ...productFindableValues,
                        collectionProductsData: {
                            ...(productFindableValues.collectionProductsData || {}),
                            collectionbrand: new mongoose.Types.ObjectId(collectionbrand)
                        }
                    };
                }

                if (collectioncategory) {
                    collectionProductsData = {
                        ...collectionProductsData, collectioncategory: new mongoose.Types.ObjectId(collectioncategory)
                    }
                    productFindableValues = {
                        ...productFindableValues,
                        collectionProductsData: {
                            ...(productFindableValues.collectionProductsData || {}),
                            collectioncategory: new mongoose.Types.ObjectId(collectioncategory)
                        }
                    };
                }

                if (offer) {
                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(offer);
                    let offerCondition: any;

                    if (isObjectId) {
                        offerCondition = { _id: new mongoose.Types.ObjectId(offer) };
                    } else {
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
                    } else {
                        query.$or = [{ _id: { $in: productIds } }];
                    }
                    // query = {
                    //     ...query,
                    //     _id: { $in: productIds }
                    // };
                }
                const productDatas = await ProductService.getProductDetailsV2(productFindableValues, {
                    countryId,
                    page: parseInt(page_size as string),
                    limit: parseInt(limit as string),
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
                })
                if (discount) {
                    discountValue = {
                        ...discount, discount: discount
                    }
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
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'Country is missing'
                }, req);
            }
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching specifications' });
        }
    }

    async findAllProducts(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 20, keyword = '', category = '', brand = '', collectionproduct = '', collectionbrand = '', collectioncategory = '', getimagegallery = 0, categories = '', brands = '', attribute = '', specification = '', offer = '', sortby = '', sortorder = '', maxprice = '', minprice = '', discount = '', getattribute = '', getspecification = '' } = req.query as ProductsFrontendQueryParams;
            let query: any = { _id: { $exists: true } };
            let collectionProductsData: any = null;
            let discountValue: any;
            let offers: any;
            query.status = '1';
            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));

            if (countryId) {
                let sort: any = {};
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
                    } as any;
                    if (page_size === 1 && typeof keyword === 'string' && keyword.trim() !== '' && keyword.trim().length > 2 && keyword !== 'undefined' && keyword !== 'null' && keyword !== null && !Number.isNaN(Number(keyword)) && keyword !== false.toString()) {
                        const customer = null;
                        const guestUser = res.locals.uuid || null;

                        await ProductService.insertOrUpdateSearchQuery(
                            keyword,
                            countryId,
                            customer ? new mongoose.Types.ObjectId(customer) : null,
                            guestUser
                        );
                    }
                }

                if (category) {
                    const categoryIsObjectId = /^[0-9a-fA-F]{24}$/.test(category);
                    var findcategory
                    if (categoryIsObjectId) {
                        findcategory = { _id: category };
                    } else {
                        findcategory = await CategoryModel.findOne({ slug: category }, '_id');
                    }
                    if (findcategory && findcategory._id) {
                        let categoryIds: any[] = [findcategory._id];
                        async function fetchCategoryAndChildren(categoryId: any) {
                            let queue = [categoryId];
                            while (queue.length > 0) {
                                const currentCategoryId = queue.shift();
                                const categoriesData = await CategoryModel.find({ parentCategory: currentCategoryId }, '_id');
                                const childCategoryIds = categoriesData.map(category => category._id);
                                queue.push(...childCategoryIds);
                                categoryIds.push(...childCategoryIds);
                            }
                        }
                        await fetchCategoryAndChildren(findcategory._id);
                        query = {
                            ...query, "productCategory.category._id": { $in: categoryIds }
                        }
                    } else {
                        query = {
                            ...query, "productCategory.category._id": findcategory
                        }
                    }
                }

                if (categories) {
                    const categoryArray = categories.split(',')
                    let categoryIds: any[] = [];
                    for await (let category of categoryArray) {
                        const categoryIsObjectId = /^[0-9a-fA-F]{24}$/.test(category);
                        var findcategory
                        if (categoryIsObjectId) {
                            findcategory = { _id: category };
                        } else {
                            findcategory = await CategoryModel.findOne({ slug: category }, '_id');
                        }
                        if (findcategory && findcategory._id) {
                            categoryIds.push(findcategory._id);
                            async function fetchCategoryAndChildren(categoryId: any) {
                                let queue = [categoryId];
                                while (queue.length > 0) {
                                    const currentCategoryId = queue.shift();
                                    const categoriesData = await CategoryModel.find({ parentCategory: currentCategoryId }, '_id');
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
                    }
                }

                if (brands) {
                    const brandArray = brands.split(',');
                    let brandIds: any[] = [];
                    let brandSlugs: any[] = [];
                    for await (let brand of brandArray) {
                        const brandIsObjectId = /^[0-9a-fA-F]{24}$/.test(brand);
                        if (brandIsObjectId) {
                            brandIds.push(new mongoose.Types.ObjectId(brand));
                        } else {
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
                            ...query, "brand._id": new mongoose.Types.ObjectId(brand)
                        }
                    } else {
                        query = {
                            ...query, "brand.slug": brand
                        }
                    }
                }

                if (attribute) {
                    let attributeDetailIds: any[] = [];
                    let attributeDetailNames: any[] = [];
                    const attributeArray = attribute.split(',');
                    for await (let attribute of attributeArray) {
                        const attributeIsObjectId = /^[0-9a-fA-F]{24}$/.test(attribute);
                        if (attributeIsObjectId) {
                            attributeDetailIds.push(new mongoose.Types.ObjectId(attribute));
                        } else {
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
                    let specificationDetailIds: any[] = [];
                    let specificationDetailNames: any[] = [];
                    const specificationArray = specification.split(',');
                    for await (let specification of specificationArray) {
                        const isObjectId = /^[0-9a-fA-F]{24}$/.test(specification);
                        if (isObjectId) {
                            specificationDetailIds.push(new mongoose.Types.ObjectId(specification));
                        } else {
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
                        ...collectionProductsData, collectionproduct: new mongoose.Types.ObjectId(collectionproduct)
                    }
                }
                if (collectionbrand) {
                    collectionProductsData = {
                        ...collectionProductsData, collectionbrand: new mongoose.Types.ObjectId(collectionbrand)
                    }
                }
                if (collectioncategory) {
                    collectionProductsData = {
                        ...collectionProductsData, collectioncategory: new mongoose.Types.ObjectId(collectioncategory)
                    }
                }

                if (offer) {
                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(offer);
                    if (isObjectId) {
                        offers = { _id: new mongoose.Types.ObjectId(offer) };
                    } else {
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
                    }
                }

                if (sortby == 'createdAt') {
                    if (sortorder === 'asc') {
                        sort = { createdAt: -1 };
                    }
                    else {
                        sort = { createdAt: 1 };
                    }
                }
                const productData: any = await ProductService.findProductList({
                    countryId,
                    page: parseInt(page_size as string),
                    limit: parseInt(limit as string),
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
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'Country is missing'
                }, req);
            }
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching specifications' });
        }
    }

    async findProductDetail(req: Request, res: Response): Promise<void> {
        try {
            const productSlug: any = req.params.slug;
            const variantSku: any = req.params.sku;
            const { getattribute = '0', getspecification = '0', getimagegallery = '0' } = req.query as ProductsFrontendQueryParams;
            let query: any = {}
            if (productSlug) {
                if (variantSku) {
                    query = {
                        ...query, 'productVariants.variantSku': new RegExp(variantSku, 'i')
                    };
                }
                const checkProductIdOrSlug = /^[0-9a-fA-F]{24}$/.test(productSlug);
                const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
                let variantDetails: any = null;
                if (checkProductIdOrSlug) {
                    query = {
                        ...query,
                        'productVariants._id': new mongoose.Types.ObjectId(productSlug),
                    }
                } else {
                    query = {
                        ...query,
                        'productVariants.slug': productSlug,
                    }
                }
                const productDetails: any = await ProductService.findProductList({
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

                let imageGallery = await ProductGalleryImagesModel.find({
                    variantId: variantDetails._id
                }).select('-createdAt -statusAt -status').sort({ _id: 1 });
                if (!imageGallery?.length) { // Check if imageGallery is empty
                    imageGallery = await ProductGalleryImagesModel.find({ productID: variantDetails.productId, variantId: null }).select('-createdAt -statusAt -status').sort({ _id: 1 });
                }
                let productSpecification: any[] = [];
                if (getspecification === '1') {
                    productSpecification = await ProductSpecificationModel.aggregate(frontendSpecificationLookup({
                        variantId: variantDetails._id
                    }));
                    if (!productSpecification?.length) {
                        productSpecification = await ProductSpecificationModel.aggregate(frontendSpecificationLookup({
                            productId: variantDetails.productId,
                            variantId: null
                        }));
                    }
                }

                let allProductVariantAttributes: any[] = [];
                let allProductVariants: any[] = [];

                if (getattribute === '1') {
                    allProductVariants = await ProductVariantsModel.find({
                        productId: variantDetails.productId,
                        countryId
                    }).select('_id productId variantSku slug isDefault quantity').exec();
                    if (allProductVariants && allProductVariants.length > 0) {
                        allProductVariantAttributes = await ProductVariantAttributesModel.aggregate(frontendVariantAttributesLookup({
                            variantId: { $in: allProductVariants.map((variant: any) => variant._id) }
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
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Products Id not found!',
                });
            }
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
    async findAllProductVariantsListWithBasicDetails(req: Request, res: Response): Promise<void> {
        try {
            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
            const allProducts = await ProductVariantsModel.find({ countryId });
            return controller.sendSuccessResponse(res, {
                requestedData: allProducts,
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'An error occurred while retrieving product specifications',
            });
        }
    }

    async findProductDetailSpecification(req: Request, res: Response): Promise<void> {
        try {
            const variantSlugOrId: string = req.params.slug;
            if (!variantSlugOrId) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Product ID or slug is required!',
                });
            }
            const isObjectId = mongoose.Types.ObjectId.isValid(variantSlugOrId);
            const variantDetails = isObjectId
                ? await ProductVariantsModel.findOne({ _id: variantSlugOrId }).lean()
                : await ProductVariantsModel.findOne({ slug: variantSlugOrId }).lean();
            if (!variantDetails) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Product variant not found!',
                });
            }
            let productSpecifications = await ProductSpecificationModel.aggregate(frontendSpecificationLookup({
                variantId: variantDetails._id
            }));
            if (!productSpecifications.length) {
                productSpecifications = await ProductSpecificationModel.aggregate(frontendSpecificationLookup({
                    productId: variantDetails.productId,
                    variantId: null
                }));
            }

            return controller.sendSuccessResponse(res, {
                requestedData: productSpecifications,
                message: 'Success'
            });

        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'An error occurred while retrieving product specifications',
            });
        }
    }

    async findProductDetailSeo(req: Request, res: Response): Promise<void> {
        try {
            const productId: any = req.params.slug;
            const variantSku: any = req.params.sku;
            if (!productId) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Product Id not found!',
                });
            }
            const checkProductIdOrSlug = /^[0-9a-fA-F]{24}$/.test(productId);
            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
            let variantDetails: any = null;
            if (checkProductIdOrSlug) {
                variantDetails = await ProductVariantsModel.findOne({
                    _id: new mongoose.Types.ObjectId(productId),
                    countryId
                });
            } else {
                variantDetails = await ProductVariantsModel.findOne({
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
                seoDetails = await SeoPageModel.findOne({
                    pageReferenceId: variantDetails.id
                }).select('-pageId -page -pageReferenceId')
            }

            if (!seoDetails) {
                seoDetails = await SeoPageModel.findOne({
                    pageId: variantDetails.productId
                }).select('-pageId -page')
            }

            const productDetails = await ProductsModel.findOne({
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

        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }

    async findAllAttributes(req: Request, res: Response): Promise<void> {
        try {
            const { category = '', brand = '', collectionproduct = '', collectionbrand = '', collectioncategory = '' } = req.query as ProductsFrontendQueryParams;

            let query: any = { _id: { $exists: true } };
            let collectionId: any;

            query.status = '1';
            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                if (category) {
                    const categoryIsObjectId = /^[0-9a-fA-F]{24}$/.test(category);
                    var findcategory
                    if (categoryIsObjectId) {
                        findcategory = { _id: category };
                    } else {
                        findcategory = await CategoryModel.findOne({ slug: category }, '_id');
                    }

                    if (findcategory && findcategory._id) {
                        let categoryIds: any[] = [findcategory._id];
                        async function fetchCategoryAndChildren(categoryId: any) {
                            let queue = [categoryId];
                            while (queue.length > 0) {
                                const currentCategoryId = queue.shift();
                                const categoriesData = await CategoryModel.find({ parentCategory: currentCategoryId }, '_id');
                                const childCategoryIds = categoriesData.map(category => category._id);

                                queue.push(...childCategoryIds);
                                categoryIds.push(...childCategoryIds);
                            }
                        }
                        await fetchCategoryAndChildren(findcategory._id);
                        query = {
                            ...query, "productCategory.category._id": { $in: categoryIds }
                        }
                    }
                }
                if (brand) {
                    const keywordRegex = new RegExp(brand, 'i');
                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(brand);
                    if (isObjectId) {
                        query = {
                            ...query, "brand": new mongoose.Types.ObjectId(brand)
                        }
                    } else {
                        const brandData = await BrandsModel.findOne({ slug: keywordRegex }).select('_id');
                        if (brandData) {
                            query = {
                                ...query, "brand": brandData?._id
                            }
                        }
                    }
                }

                if (collectionproduct) {
                    collectionId = {
                        ...collectionId, collectionproduct: new mongoose.Types.ObjectId(collectionproduct)
                    }
                }

                if (collectionbrand) {
                    collectionId = {
                        ...collectionId, collectionbrand: new mongoose.Types.ObjectId(collectionbrand)
                    }
                }

                if (collectioncategory) {
                    collectionId = {
                        ...collectionId, collectioncategory: new mongoose.Types.ObjectId(collectioncategory)
                    }
                }

                const attributes: any = await ProductService.findAllAttributes({
                    hostName: req.get('origin'),
                    query,
                    collectionId,
                });

                attributes.sort((a: any, b: any) => {
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
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'Country is missing'
                }, req);
            }
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching attributes' });
        }
    }

    async findAllSpecifications(req: Request, res: Response): Promise<void> {
        try {
            const { category = '', brand = '', collectionproduct = '', collectionbrand = '', collectioncategory = '' } = req.query as ProductsFrontendQueryParams;

            let query: any = { _id: { $exists: true } };
            let collectionId: any;

            query.status = '1';
            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                if (category) {
                    const categoryIsObjectId = /^[0-9a-fA-F]{24}$/.test(category);
                    var findcategory
                    if (categoryIsObjectId) {
                        findcategory = { _id: category };
                    } else {
                        findcategory = await CategoryModel.findOne({ slug: category }, '_id');
                    }

                    if (findcategory && findcategory._id) {
                        let categoryIds: any[] = [findcategory._id];
                        async function fetchCategoryAndChildren(categoryId: any) {
                            let queue = [categoryId];
                            while (queue.length > 0) {
                                const currentCategoryId = queue.shift();
                                const categoriesData = await CategoryModel.find({ parentCategory: currentCategoryId }, '_id');
                                const childCategoryIds = categoriesData.map(category => category._id);

                                queue.push(...childCategoryIds);
                                categoryIds.push(...childCategoryIds);
                            }
                        }
                        await fetchCategoryAndChildren(findcategory._id);
                        query = {
                            ...query, "productCategory.category._id": { $in: categoryIds }
                        }
                    } else {
                        query = {
                            ...query, "productCategory.category._id": new mongoose.Types.ObjectId(category)
                        }
                    }
                }

                if (brand) {
                    const keywordRegex = new RegExp(brand, 'i');
                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(brand);
                    if (isObjectId) {
                        query = {
                            ...query, "brand": new mongoose.Types.ObjectId(brand)
                        }
                    } else {
                        const brandData = await BrandsModel.findOne({ slug: keywordRegex }).select('_id');
                        if (brandData) {
                            query = {
                                ...query, "brand": brandData?._id
                            }
                        }
                    }
                }
                if (collectionproduct) {
                    collectionId = {
                        ...collectionId, collectionproduct: new mongoose.Types.ObjectId(collectionproduct)
                    }
                }
                if (collectionbrand) {
                    collectionId = {
                        ...collectionId, collectionbrand: new mongoose.Types.ObjectId(collectionbrand)
                    }
                }
                if (collectioncategory) {
                    collectionId = {
                        ...collectionId, collectioncategory: new mongoose.Types.ObjectId(collectioncategory)
                    }
                }

                const specifications: any = await ProductService.findAllSpecifications({
                    hostName: req.get('origin'),
                    query,
                    collectionId,
                });

                return controller.sendSuccessResponse(res, {
                    requestedData: specifications,
                    message: 'Success!'
                }, 200);

            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'Country is missing'
                }, req);
            }
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching specifications' });
        }
    }

    async youMayLikeAlso(req: Request, res: Response): Promise<void> {
        const { getbrand = '0', getattribute = '', getspecification = '', page_size = 1, limit = 30, } = req.query as ProductsFrontendQueryParams;
        const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
        if (!countryId) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Error',
                validation: 'Country is missing'
            }, req);
        }
        const customerId = res.locals.user || null;
        const guestUserId = res.locals.uuid || null;
        const searchQueryFilter: any = {
            $or: [
                { customerId },
                { guestUserId }
            ]
        };
        const searchQueries = await SearchQueriesModel.find(searchQueryFilter);
        let keywords = searchQueries.map(query => query.searchQuery).filter(Boolean);
        if (keywords.length === 0) {
            const topSearchQueries = await SearchQueriesModel.find().sort({ searchCount: -1 }).limit(10).exec();
            if (topSearchQueries.length === 0) {
                const randomProducts = await ProductService.findProductList({
                    countryId,
                    query: { _id: { $exists: true } },
                    getattribute,
                    getspecification,
                    getbrand,
                    page: 1,
                    limit: parseInt(limit as string),
                    hostName: req.get('origin'),
                });

                return controller.sendSuccessResponse(res, {
                    requestedData: randomProducts,
                    message: 'No search queries or frequent queries found. Here are some random products!'
                }, 200);
            }
            keywords = topSearchQueries.map(query => query.searchQuery).filter(Boolean);
            if (keywords.length === 0) {
                const randomProducts = await ProductService.findProductList({
                    countryId,
                    query: { _id: { $exists: true } },
                    getattribute,
                    getspecification,
                    getbrand,
                    page: 1,
                    limit: parseInt(limit as string),
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
        const productData: any = await ProductService.findProductList({
            countryId,
            query: productQuery,
            getattribute,
            getspecification,
            getbrand,
            page: parseInt(page_size as string),
            limit: parseInt(limit as string),
            hostName: req.get('origin'),
        });
        return controller.sendSuccessResponse(res, {
            requestedData: productData,
            message: 'Success!'
        }, 200);
    }

    async relatedProducts(req: Request, res: Response): Promise<void> {
        const { categories = '', getattribute = '', getspecification = '', page_size = 1, limit = 30, } = req.query as ProductsFrontendQueryParams;
        let query: any = { _id: { $exists: true } };

        if (!categories) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Error',
                validation: 'Category id is rquired'
            }, req);
        }
        const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
        if (!countryId) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Error',
                validation: 'Country is missing'
            }, req);
        }
        const categoryArray = categories.split(',');
        let categoryIds: any = [];
        let categorySlugs: any = [];

        for (const category of categoryArray) {
            const categoryIsObjectId = /^[0-9a-fA-F]{24}$/.test(category);
            if (categoryIsObjectId) {
                categoryIds.push(new mongoose.Types.ObjectId(category));
            } else {
                categorySlugs.push(category);
            }
        }

        const categoryQuery: any = {};
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

        const productData: any = await ProductService.findProductList({
            countryId,
            query,
            getattribute,
            getspecification,
            getbrand: '0',
            page: parseInt(page_size as string),
            limit: parseInt(limit as string),
            hostName: req.get('origin'),
        });
        return controller.sendSuccessResponse(res, {
            requestedData: productData,
            message: 'Success!'
        }, 200);
    }

    async getSearchSuggestions(req: Request, res: Response): Promise<any> {
        try {
            const { query = '' } = req.query;
            let results: any = null;

            if (query) {
                const searchQuery = query as string;
                const productsPromise = ProductsModel.aggregate(searchSuggestionProductsLookup).exec();
                const brandsPromise = BrandsModel.aggregate(searchSuggestionBrandsLookup).exec();
                const categoriesPromise = CategoryModel.aggregate(searchSuggestionCategoryLookup).exec();

                const [products, brands, categories] = await Promise.all([
                    productsPromise,
                    brandsPromise,
                    categoriesPromise,
                ]);

                const fuseProducts = new Fuse(products, {
                    keys: ['productTitle'],
                    includeScore: true,
                    threshold: 0.3
                });

                const fuseBrands = new Fuse(brands, {
                    keys: ['brandTitle'],
                    includeScore: true,
                    threshold: 0.4
                });

                const fuseCategories = new Fuse(categories, {
                    keys: ['categoryTitle'],
                    includeScore: true,
                    threshold: 0.4
                });

                const productResults = fuseProducts.search(searchQuery).map(result => result.item);
                const brandResults = fuseBrands.search(searchQuery).map(result => result.item);
                const categoryResults = fuseCategories.search(searchQuery).map(result => result.item);

                const uniqueTitles = new Set<string>();

                const deduplicate = (results: any[]) => {
                    return results.filter(item => {
                        const title = item.productTitle || item.brandTitle || item.categoryTitle;
                        if (uniqueTitles.has(title)) {
                            return false;
                        }
                        uniqueTitles.add(title);
                        return true;
                    });
                };

                const limitResults = (results: any[], limit: number) => {
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
                const countryId = await CommonService.findOneCountrySubDomainWithId(origin);

                const dataFetchers = [
                    {
                        key: 'topSearches',
                        promise: SearchQueriesModel.aggregate(topSearchesLookup).exec(),
                    },
                    {
                        key: 'collectionProducts',
                        promise: CommonService.findCollectionProducts({
                            hostName: origin,
                            query: { _id: { $exists: true }, page: pagesJson.search, countryId },
                            getspecification: '0',
                            getattribute: '0',
                        }),
                    },
                    {
                        key: 'collectionCategories',
                        promise: CommonService.findCollectionCategories({
                            hostName: origin,
                            query: { _id: { $exists: true }, page: pagesJson.search, countryId },
                        }),
                    },
                    {
                        key: 'collectionBrands',
                        promise: CommonService.findCollectionBrands({
                            hostName: origin,
                            query: { _id: { $exists: true }, page: pagesJson.search, countryId },
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
        } catch (error) {
            console.error('Search Error:', error);
            return controller.sendErrorResponse(res, 500, {
                message: 'An error occurred while performing the search.',
                validation: 'Search query failed'
            }, req);
        }
    }



    // async getSearchSuggestions(req: Request, res: Response): Promise<any> {
    //     try {
    //         const { query } = req.query;
    //         let results: any = null;

    //         if (query) {
    //             const searchQuery = query as string;

    //             const productsPromise = ProductsModel.aggregate([
    //                 {
    //                     $match: {
    //                         $text: { $search: searchQuery },
    //                         status: '1'
    //                     }
    //                 },
    //                 { $limit: 10 },
    //                 { $project: { productTitle: 1 } }
    //             ]).exec();

    //             const brandsPromise = BrandsModel.aggregate([
    //                 {
    //                     $match: {
    //                         $text: { $search: searchQuery }
    //                     }
    //                 },
    //                 { $limit: 10 },
    //                 { $project: { brandTitle: 1 } }
    //             ]).exec();

    //             const categoriesPromise = CategoryModel.aggregate([
    //                 {
    //                     $match: {
    //                         $text: { $search: searchQuery }
    //                     }
    //                 },
    //                 { $limit: 10 },
    //                 { $project: { categoryTitle: 1 } }
    //             ]).exec();

    //             // Wait for all queries to complete
    //             const [products, brands, categories] = await Promise.all([
    //                 productsPromise,
    //                 brandsPromise,
    //                 categoriesPromise
    //             ]);

    //             results = {
    //                 products,
    //                 brands,
    //                 categories
    //             };
    //         }

    //         return controller.sendSuccessResponse(res, {
    //             requestedData: results,
    //             message: 'Success!'
    //         }, 200);
    //     } catch (error) {
    //         console.error('Search Error:', error);
    //         return controller.sendErrorResponse(res, 500, {
    //             message: 'An error occurred while performing the search.',
    //             validation: 'Search query failed'
    //         }, req);
    //     }
    // }

}
export default new ProductController();

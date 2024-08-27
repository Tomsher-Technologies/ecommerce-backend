import mongoose from 'mongoose';
import { Request, Response } from 'express';

import BaseController from '../../admin/base-controller';
import ProductService from '../../../services/frontend/guest/product-service'
import { ProductsFrontendQueryParams } from '../../../utils/types/products';
import CommonService from '../../../services/frontend/guest/common-service';
import CategoryModel from '../../../model/admin/ecommerce/category-model';
import ProductVariantsModel from '../../../model/admin/ecommerce/product/product-variants-model';
import ProductsModel from '../../../model/admin/ecommerce/product-model';
import SeoPageModel from '../../../model/admin/seo-page-model';
import ProductGalleryImagesModel from '../../../model/admin/ecommerce/product/product-gallery-images-model';
import ProductSpecificationModel from '../../../model/admin/ecommerce/product/product-specification-model';
import { frontendSpecificationLookup } from '../../../utils/config/specification-config';
import BrandsModel from '../../../model/admin/ecommerce/brands-model';
import { frontendVariantAttributesLookup } from '../../../utils/config/attribute-config';
import ProductVariantAttributesModel from '../../../model/admin/ecommerce/product/product-variant-attribute-model';
import SearchQueriesModel from '../../../model/frontend/search-query-model';
import Fuse from 'fuse.js';
import { normalizeWord, truncateWord } from '../../../utils/helpers';
import { searchSuggestionBrandsLookup, searchSuggestionCategoryLookup, searchSuggestionProductsLookup, topSearchesLookup } from '../../../utils/config/search-suggestion-config';
import { pagesJson } from '../../../constants/pages';

const controller = new BaseController();
class ProductController extends BaseController {
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
                    const keywordRegex = new RegExp(keyword, 'i');
                    // const keywordRegex = new RegExp(keyword.split('').join('.*'), 'i');
                    query = {
                        $or: [
                            // { productTitle:  { $regex: regexQuery } },
                            { productTitle: keywordRegex },
                            { slug: keywordRegex },
                            { sku: keywordRegex },
                            { 'productCategory.category.categoryTitle': keywordRegex },
                            { 'brand.brandTitle': keywordRegex },
                            { 'productCategory.category.slug': keywordRegex },
                            { 'productVariants.slug': keywordRegex },
                            { 'productVariants.extraProductTitle': keywordRegex },
                            { 'productVariants.variantSku': keywordRegex },
                            // { 'productSpecification.specificationTitle': keywordRegex },
                            { 'productSpecification.specificationDetail.itemName': keywordRegex },
                            { 'productSpecification.specificationDetail.itemValue': keywordRegex },
                            // { 'productVariants.productSpecification.specificationTitle': keywordRegex },
                            { 'productVariants.productSpecification.specificationDetail.itemName': keywordRegex },
                            { 'productVariants.productSpecification.specificationDetail.itemValue': keywordRegex },
                            // { 'productVariants.productVariantAttributes.attributeTitle': keywordRegex },
                            { 'productVariants.productVariantAttributes.attributeDetail.itemName': keywordRegex },
                            { 'productVariants.productVariantAttributes.attributeDetail.itemValue': keywordRegex }
                        ],
                        ...query
                    } as any;
                    if (typeof keyword === 'string' && keyword.trim() !== '' && keyword.trim().length > 2 && keyword !== 'undefined' && keyword !== 'null' && keyword !== null && !Number.isNaN(Number(keyword)) && keyword !== false.toString()) {
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
                }).select('-createdAt -statusAt -status');
                if (!imageGallery?.length) { // Check if imageGallery is empty
                    imageGallery = await ProductGalleryImagesModel.find({ productID: variantDetails.productId, variantId: null }).select('-createdAt -statusAt -status');
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
                console.log('randomProducts', randomProducts);

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

                results = {
                    products: deduplicate(productResults),
                    brands: deduplicate(brandResults),
                    categories: deduplicate(categoryResults),
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

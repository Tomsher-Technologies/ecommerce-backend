import mongoose from 'mongoose';
import { Request, Response } from 'express';

import BaseController from '../../admin/base-controller';
import ProductService from '../../../services/frontend/guest/product-service'
import { ProductsFrontendQueryParams, ProductsQueryParams } from '../../../utils/types/products';
import CommonService from '../../../services/frontend/guest/common-service';
import CategoryModel from '../../../model/admin/ecommerce/category-model';
import ProductVariantsModel from '../../../model/admin/ecommerce/product/product-variants-model';
import ProductsModel from '../../../model/admin/ecommerce/product-model';
import SeoPageModel, { SeoPageProps } from '../../../model/admin/seo-page-model';
import ProductGalleryImagesModel from '../../../model/admin/ecommerce/product/product-gallery-images-model';
import ProductSpecificationModel from '../../../model/admin/ecommerce/product/product-specification-model';
import { collections } from '../../../constants/collections';
import { frontendSpecificationLookup } from '../../../utils/config/specification-config';
const controller = new BaseController();

class ProductController extends BaseController {
    async findAllProducts(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 20, keyword = '', category = '', brand = '', collectionproduct = '', collectionbrand = '', collectioncategory = '', getimagegallery = 0, categories = '', brands = '', attribute = '', specification = '', offer = '', sortby = '', sortorder = '', maxprice = '', minprice = '', discount = '', getattribute = '', getspecification = '' } = req.query as ProductsFrontendQueryParams;
            // let getspecification = ''
            // let getattribute = ''
            let getSeo = '1'
            let getBrand = '1'
            let getCategory = '1'
            let query: any = { _id: { $exists: true } };
            let collectionProductsData: any;
            let discountValue: any;
            let offers: any;
            const orConditionsForAttributes: any = [];
            const orConditionsForBrands: any = [];
            const orConditionsForcategory: any = [];
            const orConditionsForSpecification: any = [];
            const orConditionsForcategories: any = [];

            query.status = '1';
            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));

            if (countryId) {
                let sort: any = {};
                if (sortby && sortorder) {
                    sort[sortby] = sortorder === 'desc' ? -1 : 1;
                }
                if (keyword) {
                    const keywordRegex = new RegExp(keyword, 'i');
                    query = {
                        $or: [
                            { productTitle: keywordRegex },
                            { slug: keywordRegex },
                            { 'productCategory.category.categoryTitle': keywordRegex },
                            { 'brand.brandTitle': keywordRegex },
                            { 'productCategory.category.slug': keywordRegex },
                            { sku: keywordRegex },
                            { 'productVariants.slug': keywordRegex },
                            { 'productVariants.extraProductTitle': keywordRegex },
                            { 'productVariants.variantSku': keywordRegex },
                            { 'productVariants.productSpecification.specificationTitle': keywordRegex },
                            { 'productVariants.productSpecification.slug': keywordRegex },
                            { 'productVariants.productSpecification.specificationDetail.itemName': keywordRegex },
                            { 'productVariants.productSpecification.specificationDetail.itemValue': keywordRegex },
                            { 'productVariants.productVariantAttributes.attributeTitle': keywordRegex },
                            { 'productVariants.productVariantAttributes.slug': keywordRegex },
                            { 'productVariants.productVariantAttributes.attributeDetail.itemName': keywordRegex },
                            { 'productVariants.productVariantAttributes.attributeDetail.itemValue': keywordRegex }

                        ],
                        ...query
                    } as any;
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
                if (categories) {
                    const categoryArray = categories.split(',')
                    for await (let category of categoryArray) {
                        const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
                        if (isObjectId) {
                            orConditionsForcategories.push({ "productCategory.category._id": new mongoose.Types.ObjectId(category) });
                            const findcategory = await CategoryModel.findOne({ _id: category }, '_id');
                            if (findcategory && findcategory._id) {
                                async function fetchCategoryAndChildren(categoryId: any) {
                                    const categoriesData = await CategoryModel.find({ parentCategory: categoryId }, '_id');
                                    const categoryIds = categoriesData.map(category => category._id);
                                    for (let childId of categoryIds) {
                                        orConditionsForcategories.push({ "productCategory.category._id": childId });
                                        await fetchCategoryAndChildren(childId);
                                    }
                                }
                                await fetchCategoryAndChildren(findcategory._id);
                                orConditionsForcategories.push({ "productCategory.category._id": findcategory._id });
                            }
                        } else {
                            orConditionsForcategories.push({ "productCategory.category.slug": category });
                            const findcategory = await CategoryModel.findOne({ slug: category }, '_id');
                            if (findcategory && findcategory._id) {
                                async function fetchCategoryAndChildren(categoryId: any) {
                                    const categoriesData = await CategoryModel.find({ parentCategory: categoryId }, '_id');
                                    const categoryIds = categoriesData.map(category => category._id);
                                    for (let childId of categoryIds) {
                                        orConditionsForcategories.push({ "productCategory.category._id": childId });
                                        await fetchCategoryAndChildren(childId);
                                    }
                                }
                                await fetchCategoryAndChildren(findcategory._id);
                                orConditionsForcategories.push({ "productCategory.category._id": findcategory._id });
                            }
                        }
                    }
                }

                if (attribute) {
                    const attributeArray = attribute.split(',')
                    for await (let attribute of attributeArray) {
                        const isObjectId = /^[0-9a-fA-F]{24}$/.test(attribute);
                        if (isObjectId) {
                            orConditionsForAttributes.push({ "productVariants.productVariantAttributes.attributeDetail._id": new mongoose.Types.ObjectId(attribute) })
                        } else {
                            orConditionsForAttributes.push({ "productVariants.productVariantAttributes.attributeDetail.itemName": attribute })
                        }
                    }
                }

                if (specification) {
                    const specificationArray = specification.split(',')
                    for await (let specification of specificationArray) {
                        const isObjectId = /^[0-9a-fA-F]{24}$/.test(specification);
                        if (isObjectId) {
                            orConditionsForSpecification.push({ "productVariants.productSpecification.specificationDetail._id": new mongoose.Types.ObjectId(specification) })
                        } else {
                            orConditionsForSpecification.push({ "productVariants.productSpecification.specificationDetail.itemName": specification })
                        }
                    }
                }

                if (brands) {
                    const brandArray = brands.split(',')
                    for await (let brand of brandArray) {
                        const isObjectId = /^[0-9a-fA-F]{24}$/.test(brand);
                        if (isObjectId) {
                            orConditionsForBrands.push({ "brand._id": new mongoose.Types.ObjectId(brand) });
                        } else {
                            orConditionsForBrands.push({ "brand.slug": brand });
                        }
                    }
                }

                if (category) {
                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
                    if (isObjectId) {
                        const findcategory = await CategoryModel.findOne({ _id: new mongoose.Types.ObjectId(category) }, '_id');
                        if (findcategory && findcategory._id) {
                            async function fetchCategoryAndChildren(categoryId: any) {
                                const categoriesData = await CategoryModel.find({ parentCategory: categoryId }, '_id');
                                if (categoriesData && categoriesData.length > 0) {
                                    const categoryIds = categoriesData.map(category => category._id);
                                    for (let childId of categoryIds) {
                                        orConditionsForcategory.push({ "productCategory.category._id": childId });
                                        await fetchCategoryAndChildren(childId);
                                    }
                                }
                            }
                            await fetchCategoryAndChildren(findcategory._id);
                            orConditionsForcategory.push({ "productCategory.category._id": findcategory._id });
                        } else {
                            query = {
                                ...query, "productCategory.category._id": new mongoose.Types.ObjectId(category)
                            }
                        }
                    } else {
                        orConditionsForcategory.push({ "productCategory.category.slug": category });
                        const findcategory = await CategoryModel.findOne({ slug: category }, '_id');
                        if (findcategory && findcategory._id) {
                            async function fetchCategoryAndChildren(categoryId: any) {
                                const categoriesData = await CategoryModel.find({ parentCategory: categoryId }, '_id');
                                const categoryIds = categoriesData.map(category => category._id);
                                for (let childId of categoryIds) {
                                    orConditionsForcategory.push({ "productCategory.category._id": childId });
                                    await fetchCategoryAndChildren(childId);
                                }
                            }
                            await fetchCategoryAndChildren(findcategory._id);
                            orConditionsForcategory.push({ "productCategory.category._id": findcategory._id });
                        } else {
                            query = {
                                ...query, "productCategory.category.slug": category
                            };
                        }
                    }
                }

                if (brand) {
                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(brand);
                    if (isObjectId) {
                        query = {
                            ...query, "brand._id": new mongoose.Types.ObjectId(brand)
                        }
                    } else {
                        query = {
                            ...query, "brand.slug": brand
                        }
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
                if (maxprice || minprice) {
                    query['productVariants.price'] = {};
                    if (minprice) {
                        query['productVariants.price'].$gte = Number(minprice);
                    }
                    if (maxprice) {
                        query['productVariants.price'].$lte = Number(maxprice);
                    }
                }
                if (discount) {
                    discountValue = {
                        ...discount, discount: discount
                    }
                }
                if (orConditionsForAttributes.length > 0 || orConditionsForSpecification.length > 0 || orConditionsForBrands.length > 0 || orConditionsForcategory.length > 0 || orConditionsForcategories.length > 0) {
                    query.$and = [];
                    if (orConditionsForAttributes.length > 0) {
                        query.$and.push({
                            $or: orConditionsForAttributes
                        });
                    }
                    if (orConditionsForSpecification.length > 0) {
                        query.$and.push({
                            $or: orConditionsForSpecification
                        });
                    }
                    if (orConditionsForBrands.length > 0) {
                        query.$and.push({
                            $or: orConditionsForBrands
                        });
                    }
                    if (orConditionsForcategories.length > 0) {
                        query.$and.push({
                            $or: orConditionsForcategories
                        });
                    }
                    if (orConditionsForcategory.length > 0) {
                        query.$and.push({
                            $or: orConditionsForcategory
                        });
                    }
                }

                if (sortby == 'createdAt') {
                    if (sortorder === 'asc') {
                        sort = { createdAt: -1 };
                    } // Sort by newest first by default
                    else {
                        sort = { createdAt: 1 };
                    }
                }
                const productData: any = await ProductService.findProductList({
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
                    getSeo,
                    hostName: req.get('origin'),
                });
                if (sortby == "price") {
                    productData.sort((a: any, b: any) => {
                        const getPrice = (product: any) => {
                            let variant = product.productVariants.find((v: any) => v.isDefault === 1 && v.quantity > 0) ||
                                product.productVariants.find((v: any) => v.slug === product.slug && v.quantity > 0) ||
                                product.productVariants.find((v: any) => v.quantity > 0) ||
                                product.productVariants[0];
                            return variant.price;
                        };
                        const aPrice = getPrice(a);
                        const bPrice = getPrice(b);
                        if (sortorder === 'asc') {
                            return aPrice - bPrice;
                        } else {
                            return bPrice - aPrice;
                        }
                    });
                }
                // const totalProductData: any = await ProductService.findProductList({
                //     query,
                //     collectionProductsData,
                //     discount,
                //     offers,
                //     hostName: req.get('origin'),
                // });
                return controller.sendSuccessResponse(res, {
                    requestedData: productData,
                    // totalCount: totalProductData?.length || 0,
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
            const productId: any = req.params.slug;
            const variantSku: any = req.params.sku;
            const { getattribute = '', getspecification = '', getimagegallery = '' } = req.query as ProductsFrontendQueryParams;
            let query: any = {}
            if (productId) {
                if (variantSku) {
                    query = {
                        ...query, 'productVariants.variantSku': variantSku
                    };
                }
                const checkProductIdOrSlug = /^[0-9a-fA-F]{24}$/.test(productId);
                const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
                let variantDetails: any = null;
                if (checkProductIdOrSlug) {
                    query = {
                        ...query, 'productVariants._id': new mongoose.Types.ObjectId(productId)
                    }
                    variantDetails = await ProductVariantsModel.findOne({
                        _id: new mongoose.Types.ObjectId(productId),
                        countryId
                    });
                } else {
                    query = {
                        ...query, 'productVariants.slug': productId
                    }
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
                const productDetails: any = await ProductService.findProductList({
                    query,
                    getattribute,
                    hostName: req.get('origin'),
                });
                let imageGallery = await ProductGalleryImagesModel.find({
                    variantId: variantDetails._id
                }).select('-createdAt -statusAt -status');
                if (!imageGallery?.length) { // Check if imageGallery is empty
                    imageGallery = await ProductGalleryImagesModel.find({ productID: variantDetails.productId }).select('-createdAt -statusAt -status');
                }
                let productSpecification = await ProductSpecificationModel.aggregate(frontendSpecificationLookup({
                    variantId: variantDetails._id
                }));
                if (!productSpecification?.length) {
                    productSpecification = await ProductSpecificationModel.aggregate(frontendSpecificationLookup({
                        productId: variantDetails.productId
                    }));
                }
                return controller.sendSuccessResponse(res, {
                    requestedData: {
                        product: {
                            ...productDetails[0],
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
            }).select('_id productTitle slug longDescription productImageUrl');

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
            const { category = '', brand = '', collectionproduct = '', collectionbrand = '', collectioncategory = '', sortby = 'attributeTitle', sortorder = 'asc' } = req.query as ProductsFrontendQueryParams;

            let query: any = { _id: { $exists: true } };
            let products: any;
            const orConditionsForcategory: any = [];

            query.status = '1';
            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                const sort: any = {};
                if (sortby && sortorder) {
                    sort[sortby] = sortorder === 'desc' ? -1 : 1;
                }
                if (category) {

                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);

                    if (isObjectId) {
                        orConditionsForcategory.push({ "productCategory.category._id": new mongoose.Types.ObjectId(category) });
                        const findcategory = await CategoryModel.findOne({ _id: category }, '_id');
                        if (findcategory && findcategory._id) {
                            async function fetchCategoryAndChildren(categoryId: any) {
                                const categoriesData = await CategoryModel.find({ parentCategory: categoryId }, '_id');
                                const categoryIds = categoriesData.map(category => category._id);

                                for (let childId of categoryIds) {
                                    orConditionsForcategory.push({ "productCategory.category._id": childId });
                                    await fetchCategoryAndChildren(childId);
                                }
                            }
                            await fetchCategoryAndChildren(findcategory._id);
                            orConditionsForcategory.push({ "productCategory.category._id": findcategory._id });
                        } else {
                            query = {
                                ...query, "productCategory.category._id": new mongoose.Types.ObjectId(category)
                            }
                        }
                    } else {
                        orConditionsForcategory.push({ "productCategory.category.slug": category });
                        const findcategory = await CategoryModel.findOne({ slug: category }, '_id');
                        if (findcategory && findcategory._id) {
                            async function fetchCategoryAndChildren(categoryId: any) {
                                const categoriesData = await CategoryModel.find({ parentCategory: categoryId }, '_id');
                                const categoryIds = categoriesData.map(category => category._id);
                                for (let childId of categoryIds) {
                                    orConditionsForcategory.push({ "productCategory.category._id": childId });
                                    await fetchCategoryAndChildren(childId);
                                }
                            }
                            await fetchCategoryAndChildren(findcategory._id);
                            orConditionsForcategory.push({ "productCategory.category._id": findcategory._id });
                        } else {
                            query = {
                                ...query, "productCategory.category.slug": category
                            };
                        }
                    }
                }
                if (brand) {
                    const keywordRegex = new RegExp(brand, 'i');
                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(brand);
                    if (isObjectId) {
                        query = {
                            ...query, "brand._id": new mongoose.Types.ObjectId(brand)
                        }
                    } else {
                        query = {
                            ...query, "brand.slug": keywordRegex
                        }
                    }
                }

                if (collectionproduct) {
                    products = {
                        ...products, collectionproduct: new mongoose.Types.ObjectId(collectionproduct)
                    }
                }

                if (collectionbrand) {
                    products = {
                        ...products, collectionbrand: new mongoose.Types.ObjectId(collectionbrand)
                    }
                }

                if (collectioncategory) {
                    products = {
                        ...products, collectioncategory: new mongoose.Types.ObjectId(collectioncategory)
                    }
                }

                if (orConditionsForcategory.length > 0) {
                    query.$and = [];
                    query.$and.push({
                        $or: orConditionsForcategory
                    });
                }

                const attributes: any = await ProductService.findAllAttributes({
                    hostName: req.get('origin'),
                    query,
                    products,
                    sort
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
            const { category = '', brand = '', collectionproduct = '', collectionbrand = '', collectioncategory = '', sortby = 'specificationTitle', sortorder = 'asc' } = req.query as ProductsFrontendQueryParams;

            let query: any = { _id: { $exists: true } };
            let products: any;
            const orConditionsForcategory: any = [];

            query.status = '1';
            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                const sort: any = {};
                if (sortby && sortorder) {
                    sort[sortby] = sortorder === 'desc' ? -1 : 1;
                }
                if (category) {
                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
                    if (isObjectId) {
                        orConditionsForcategory.push({ "productCategory.category._id": new mongoose.Types.ObjectId(category) });
                        const findcategory = await CategoryModel.findOne({ _id: category }, '_id');

                        if (findcategory && findcategory._id) {
                            async function fetchCategoryAndChildren(categoryId: any) {
                                const categoriesData = await CategoryModel.find({ parentCategory: categoryId }, '_id');
                                const categoryIds = categoriesData.map(category => category._id);

                                for (let childId of categoryIds) {
                                    orConditionsForcategory.push({ "productCategory.category._id": childId });
                                    await fetchCategoryAndChildren(childId);
                                }
                            }
                            await fetchCategoryAndChildren(findcategory._id);
                            orConditionsForcategory.push({ "productCategory.category._id": findcategory._id });
                        } else {
                            query = {
                                ...query, "productCategory.category._id": new mongoose.Types.ObjectId(category)
                            }
                        }
                    } else {
                        orConditionsForcategory.push({ "productCategory.category.slug": category });
                        const findcategory = await CategoryModel.findOne({ slug: category }, '_id');

                        if (findcategory && findcategory._id) {
                            async function fetchCategoryAndChildren(categoryId: any) {
                                const categoriesData = await CategoryModel.find({ parentCategory: categoryId }, '_id');
                                const categoryIds = categoriesData.map(category => category._id);
                                for (let childId of categoryIds) {
                                    orConditionsForcategory.push({ "productCategory.category._id": childId });
                                    await fetchCategoryAndChildren(childId);
                                }
                            }
                            await fetchCategoryAndChildren(findcategory._id);
                            orConditionsForcategory.push({ "productCategory.category._id": findcategory._id });
                        } else {
                            query = {
                                ...query, "productCategory.category.slug": category
                            };
                        }
                    }
                }
                if (brand) {
                    const keywordRegex = new RegExp(brand, 'i');
                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(brand);
                    if (isObjectId) {
                        query = {
                            ...query, "brand._id": new mongoose.Types.ObjectId(brand)
                        }
                    } else {
                        query = {
                            ...query, "brand.slug": keywordRegex
                        }
                    }
                }
                if (collectionproduct) {
                    products = {
                        ...products, collectionproduct: new mongoose.Types.ObjectId(collectionproduct)
                    }
                }
                if (collectionbrand) {
                    products = {
                        ...products, collectionbrand: new mongoose.Types.ObjectId(collectionbrand)
                    }
                }
                if (collectioncategory) {
                    products = {
                        ...products, collectioncategory: new mongoose.Types.ObjectId(collectioncategory)
                    }
                }
                if (orConditionsForcategory.length > 0) {
                    query.$and = [];
                    query.$and.push({
                        $or: orConditionsForcategory
                    });
                }

                const specifications: any = await ProductService.findAllSpecifications({
                    hostName: req.get('origin'),
                    query,
                    products,
                    sort
                });

                specifications.sort((a: any, b: any) => {
                    const titleA = a.specificationTitle.toLowerCase();
                    const titleB = b.specificationTitle.toLowerCase();

                    if (titleA < titleB) {
                        return -1;
                    }
                    if (titleA > titleB) {
                        return 1;
                    }
                    return 0;
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

}
export default new ProductController();
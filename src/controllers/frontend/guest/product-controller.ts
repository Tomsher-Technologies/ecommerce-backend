import mongoose from 'mongoose';
import { Request, Response } from 'express';

import BaseController from '../../admin/base-controller';
import ProductService from '../../../services/frontend/guest/product-service'
import { ProductsFrontendQueryParams, ProductsQueryParams } from '../../../utils/types/products';
import CommonService from '../../../services/frontend/guest/common-service';
import CategoryModel from '../../../model/admin/ecommerce/category-model';
const controller = new BaseController();

class ProductController extends BaseController {
    async findAllAttributes(req: Request, res: Response): Promise<void> {
        try {
            const { category = '', brand = '', collectionproduct = '', collectionbrand = '', collectioncategory = '', sortby = 'attributeTitle', sortorder = 'asc' } = req.query as ProductsFrontendQueryParams;

            let query: any = { _id: { $exists: true } };
            let products: any;

            query.status = '1';
            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {


                const sort: any = {};
                if (sortby && sortorder) {
                    sort[sortby] = sortorder === 'desc' ? -1 : 1;
                }
                if (category) {

                    const keywordRegex = new RegExp(category, 'i');

                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);

                    if (isObjectId) {
                        query = {
                            ...query, "productCategory.category._id": new mongoose.Types.ObjectId(category)
                        }

                    } else {
                        query = {
                            ...query, "productCategory.category.slug": keywordRegex
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

            query.status = '1';
            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));

            if (countryId) {
                const sort: any = {};
                if (sortby && sortorder) {
                    sort[sortby] = sortorder === 'desc' ? -1 : 1;
                }
                if (category) {

                    const keywordRegex = new RegExp(category, 'i');

                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);

                    if (isObjectId) {
                        query = {
                            ...query, "productCategory.category._id": new mongoose.Types.ObjectId(category)
                        }

                    } else {
                        query = {
                            ...query, "productCategory.category.slug": keywordRegex
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
    async findProductDetail(req: Request, res: Response): Promise<void> {
        try {
            const productId: any = req.params.slug;
            const sku: any = req.params.sku;
            const { getattribute = '', getspecification = '', getImageGallery = '' } = req.query as ProductsFrontendQueryParams;

            if (productId) {
                const product: any = await ProductService.findOne(
                    {
                        productId,
                        sku,
                        getImageGallery,
                        getattribute,
                        getspecification,
                        hostName: req.get('host')
                    }
                );

                if (product) {

                    controller.sendSuccessResponse(res, {
                        requestedData: {
                            ...product

                        },
                        message: 'Success'
                    });
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Products are not found!',
                    });
                }
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Products Id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }

    async findAllProducts(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 20, keyword = '', category = '', brand = '', collectionproduct = '', collectionbrand = '', collectioncategory = '', getImageGallery = 0, categories = '', brands = '', attribute = '', specification = '', offer = '', sortby = '', sortorder = '', maxprice = '', minprice = '', discount = '', getattribute = '', getspecification = '' } = req.query as ProductsFrontendQueryParams;
            // let getspecification = ''
            // let getattribute = ''
            let getSeo = '1'
            let getBrand = '1'
            let getCategory = '1'
            let query: any = { _id: { $exists: true } };
            let products: any;
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
                                // Function to recursively fetch category IDs and their children
                                async function fetchCategoryAndChildren(categoryId: any) {
                                    const categoriesData = await CategoryModel.find({ parentCategory: categoryId }, '_id');
                                    const categoryIds = categoriesData.map(category => category._id);

                                    for (let childId of categoryIds) {
                                        orConditionsForcategories.push({ "productCategory.category._id": childId });

                                        // Recursively fetch children of childId
                                        await fetchCategoryAndChildren(childId);
                                    }
                                }

                                // Start fetching categories recursively
                                await fetchCategoryAndChildren(findcategory._id);

                                // Push condition for the parent category itself
                                orConditionsForcategories.push({ "productCategory.category._id": findcategory._id });
                            }
                        } else {
                            orConditionsForcategories.push({ "productCategory.category.slug": category });
                            const findcategory = await CategoryModel.findOne({ slug: category }, '_id');

                            if (findcategory && findcategory._id) {
                                // Function to recursively fetch category IDs and their children
                                async function fetchCategoryAndChildren(categoryId: any) {
                                    const categoriesData = await CategoryModel.find({ parentCategory: categoryId }, '_id');
                                    const categoryIds = categoriesData.map(category => category._id);

                                    for (let childId of categoryIds) {
                                        orConditionsForcategories.push({ "productCategory.category._id": childId });

                                        // Recursively fetch children of childId
                                        await fetchCategoryAndChildren(childId);
                                    }
                                }

                                // Start fetching categories recursively
                                await fetchCategoryAndChildren(findcategory._id);

                                // Push condition for the parent category itself
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

                        const isObjectId = /^[0-9a-fA-F]{24}$/.test(attribute);

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
                        orConditionsForcategory.push({ "productCategory.category._id": new mongoose.Types.ObjectId(category) });
                        const findcategory = await CategoryModel.findOne({ _id: category }, '_id');

                        if (findcategory && findcategory._id) {
                            // Function to recursively fetch category IDs and their children
                            async function fetchCategoryAndChildren(categoryId: any) {
                                const categoriesData = await CategoryModel.find({ parentCategory: categoryId }, '_id');
                                const categoryIds = categoriesData.map(category => category._id);

                                for (let childId of categoryIds) {
                                    orConditionsForcategory.push({ "productCategory.category._id": childId });

                                    // Recursively fetch children of childId
                                    await fetchCategoryAndChildren(childId);
                                }
                            }

                            // Start fetching categories recursively
                            await fetchCategoryAndChildren(findcategory._id);

                            // Push condition for the parent category itself
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
                            // Function to recursively fetch category IDs and their children
                            async function fetchCategoryAndChildren(categoryId: any) {
                                const categoriesData = await CategoryModel.find({ parentCategory: categoryId }, '_id');
                                const categoryIds = categoriesData.map(category => category._id);

                                for (let childId of categoryIds) {
                                    orConditionsForcategory.push({ "productCategory.category._id": childId });

                                    // Recursively fetch children of childId
                                    await fetchCategoryAndChildren(childId);
                                }
                            }

                            // Start fetching categories recursively
                            await fetchCategoryAndChildren(findcategory._id);

                            // Push condition for the parent category itself
                            orConditionsForcategory.push({ "productCategory.category._id": findcategory._id });
                        } else {
                            // If category not found, fallback to direct query by slug
                            query = {
                                ...query, "productCategory.category.slug": category
                            };

                        }
                        console.log("orConditionsForcategory", orConditionsForcategory);
                    }

                }

                if (brand) {

                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);

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

                if (orConditionsForAttributes.length > 0 || orConditionsForBrands.length > 0 || orConditionsForcategory.length > 0 || orConditionsForcategories.length > 0) {
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
                    products,
                    discount,
                    offers,
                    getImageGallery,
                    getattribute,
                    getspecification,
                    getSeo,
                    hostName: req.get('origin'),
                });
                if (sortby == "price") {
                    productData.sort((a: any, b: any) => {
                        const aPrice = a.productVariants[0]?.[sortby] || 0;
                        const bPrice = b.productVariants[0]?.[sortby] || 0;

                        if (sortorder === 'asc') {
                            return aPrice - bPrice;
                        } else {
                            return bPrice - aPrice;
                        }
                    });
                }
                const totalProductData: any = await ProductService.findProductList({
                    query,
                    products,
                    discount,
                    offers,
                    hostName: req.get('origin'),
                });
                return controller.sendSuccessResponse(res, {
                    requestedData: productData,
                    totalCount: totalProductData?.length || 0,
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
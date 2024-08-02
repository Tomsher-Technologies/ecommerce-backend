"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const base_controller_1 = __importDefault(require("../../admin/base-controller"));
const product_service_1 = __importDefault(require("../../../services/frontend/guest/product-service"));
const common_service_1 = __importDefault(require("../../../services/frontend/guest/common-service"));
const category_model_1 = __importDefault(require("../../../model/admin/ecommerce/category-model"));
const product_variants_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-variants-model"));
const product_model_1 = __importDefault(require("../../../model/admin/ecommerce/product-model"));
const seo_page_model_1 = __importDefault(require("../../../model/admin/seo-page-model"));
const product_gallery_images_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-gallery-images-model"));
const product_specification_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-specification-model"));
const specification_config_1 = require("../../../utils/config/specification-config");
const brands_model_1 = __importDefault(require("../../../model/admin/ecommerce/brands-model"));
const attribute_config_1 = require("../../../utils/config/attribute-config");
const product_variant_attribute_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-variant-attribute-model"));
const controller = new base_controller_1.default();
class ProductController extends base_controller_1.default {
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
                    const keywordRegex = new RegExp(keyword, 'i');
                    query = {
                        $or: [
                            { productTitle: keywordRegex },
                            { slug: keywordRegex },
                            { sku: keywordRegex },
                            { 'productCategory.category.categoryTitle': keywordRegex },
                            { 'brand.brandTitle': keywordRegex },
                            { 'productCategory.category.slug': keywordRegex },
                            { 'productVariants.slug': keywordRegex },
                            { 'productVariants.extraProductTitle': keywordRegex },
                            { 'productVariants.variantSku': keywordRegex },
                            { 'productSpecification.specificationTitle': keywordRegex },
                            { 'productSpecification.slug': keywordRegex },
                            { 'productSpecification.specificationDetail.itemName': keywordRegex },
                            { 'productSpecification.specificationDetail.itemValue': keywordRegex },
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
                    };
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
                }
                if (categories) {
                    const categoryArray = categories.split(',');
                    let categoryIds = null;
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
                            categoryIds = [findcategory._id];
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
                    sortby
                });
                // if (sortby == "price") {
                //     productData.sort((a: any, b: any) => {
                //         const getPrice = (product: any) => {
                //             let variant = product.productVariants.find((v: any) => v.isDefault === 1 && v.quantity > 0) ||
                //                 product.productVariants.find((v: any) => v.slug === product.slug && v.quantity > 0) ||
                //                 product.productVariants.find((v: any) => v.quantity > 0) ||
                //                 product.productVariants[0];
                //             return variant.price;
                //         };
                //         const aPrice = getPrice(a);
                //         const bPrice = getPrice(b);
                //         if (sortorder === 'asc') {
                //             return aPrice - bPrice;
                //         } else {
                //             return bPrice - aPrice;
                //         }
                //     });
                // }
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
                }).select('-createdAt -statusAt -status');
                if (!imageGallery?.length) { // Check if imageGallery is empty
                    imageGallery = await product_gallery_images_model_1.default.find({ productID: variantDetails.productId, variantId: null }).select('-createdAt -statusAt -status');
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
}
exports.default = new ProductController();

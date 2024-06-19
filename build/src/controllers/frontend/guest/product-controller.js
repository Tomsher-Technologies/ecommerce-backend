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
const controller = new base_controller_1.default();
class ProductController extends base_controller_1.default {
    async findAllAttributes(req, res) {
        try {
            const { category = '', brand = '', collectionproduct = '', collectionbrand = '', collectioncategory = '', sortby = 'attributeTitle', sortorder = 'asc' } = req.query;
            let query = { _id: { $exists: true } };
            let products;
            query.status = '1';
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                const sort = {};
                if (sortby && sortorder) {
                    sort[sortby] = sortorder === 'desc' ? -1 : 1;
                }
                if (category) {
                    const keywordRegex = new RegExp(category, 'i');
                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
                    if (isObjectId) {
                        query = {
                            ...query, "productCategory.category._id": new mongoose_1.default.Types.ObjectId(category)
                        };
                    }
                    else {
                        query = {
                            ...query, "productCategory.category.slug": keywordRegex
                        };
                    }
                }
                if (brand) {
                    const keywordRegex = new RegExp(brand, 'i');
                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(brand);
                    if (isObjectId) {
                        query = {
                            ...query, "brand._id": new mongoose_1.default.Types.ObjectId(brand)
                        };
                    }
                    else {
                        query = {
                            ...query, "brand.slug": keywordRegex
                        };
                    }
                }
                if (collectionproduct) {
                    products = {
                        ...products, collectionproduct: new mongoose_1.default.Types.ObjectId(collectionproduct)
                    };
                }
                if (collectionbrand) {
                    products = {
                        ...products, collectionbrand: new mongoose_1.default.Types.ObjectId(collectionbrand)
                    };
                }
                if (collectioncategory) {
                    products = {
                        ...products, collectioncategory: new mongoose_1.default.Types.ObjectId(collectioncategory)
                    };
                }
                const attributes = await product_service_1.default.findAllAttributes({
                    hostName: req.get('origin'),
                    query,
                    products,
                    sort
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
            const { category = '', brand = '', collectionproduct = '', collectionbrand = '', collectioncategory = '', sortby = 'specificationTitle', sortorder = 'asc' } = req.query;
            let query = { _id: { $exists: true } };
            let products;
            query.status = '1';
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                const sort = {};
                if (sortby && sortorder) {
                    sort[sortby] = sortorder === 'desc' ? -1 : 1;
                }
                if (category) {
                    const keywordRegex = new RegExp(category, 'i');
                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
                    if (isObjectId) {
                        query = {
                            ...query, "productCategory.category._id": new mongoose_1.default.Types.ObjectId(category)
                        };
                    }
                    else {
                        query = {
                            ...query, "productCategory.category.slug": keywordRegex
                        };
                    }
                }
                if (brand) {
                    const keywordRegex = new RegExp(brand, 'i');
                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(brand);
                    if (isObjectId) {
                        query = {
                            ...query, "brand._id": new mongoose_1.default.Types.ObjectId(brand)
                        };
                    }
                    else {
                        query = {
                            ...query, "brand.slug": keywordRegex
                        };
                    }
                }
                if (collectionproduct) {
                    products = {
                        ...products, collectionproduct: new mongoose_1.default.Types.ObjectId(collectionproduct)
                    };
                }
                if (collectionbrand) {
                    products = {
                        ...products, collectionbrand: new mongoose_1.default.Types.ObjectId(collectionbrand)
                    };
                }
                if (collectioncategory) {
                    products = {
                        ...products, collectioncategory: new mongoose_1.default.Types.ObjectId(collectioncategory)
                    };
                }
                const specifications = await product_service_1.default.findAllSpecifications({
                    hostName: req.get('origin'),
                    query,
                    products,
                    sort
                });
                specifications.sort((a, b) => {
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
            const productId = req.params.slug;
            const variantSku = req.params.sku;
            const { getattribute = '', getspecification = '', getimagegallery = '' } = req.query;
            let query = {};
            if (productId) {
                if (variantSku) {
                    query = {
                        ...query, 'productVariants.variantSku': variantSku
                    };
                }
                const data = /^[0-9a-fA-F]{24}$/.test(productId);
                if (data) {
                    query = {
                        ...query,
                        $or: [
                            { 'productVariants._id': new mongoose_1.default.Types.ObjectId(productId) },
                            { _id: new mongoose_1.default.Types.ObjectId(productId) }
                        ]
                    };
                }
                else {
                    query = {
                        ...query, 'productVariants.slug': productId
                    };
                }
                const product = await product_service_1.default.findOneProduct({
                    query,
                    getimagegallery,
                    getattribute,
                    getspecification,
                    hostName: req.get('host')
                });
                if (product) {
                    controller.sendSuccessResponse(res, {
                        requestedData: {
                            product,
                            reviews: []
                        },
                        message: 'Success'
                    });
                }
                else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Products are not found!',
                    });
                }
            }
            else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Products Id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
    async findAllProducts(req, res) {
        try {
            const { page_size = 1, limit = 20, keyword = '', category = '', brand = '', collectionproduct = '', collectionbrand = '', collectioncategory = '', getimagegallery = 0, categories = '', brands = '', attribute = '', specification = '', offer = '', sortby = '', sortorder = '', maxprice = '', minprice = '', discount = '', getattribute = '', getspecification = '' } = req.query;
            // let getspecification = ''
            // let getattribute = ''
            let getSeo = '1';
            let getBrand = '1';
            let getCategory = '1';
            let query = { _id: { $exists: true } };
            let products;
            let discountValue;
            let offers;
            const orConditionsForAttributes = [];
            const orConditionsForBrands = [];
            const orConditionsForcategory = [];
            const orConditionsForSpecification = [];
            const orConditionsForcategories = [];
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
                if (categories) {
                    const categoryArray = categories.split(',');
                    for await (let category of categoryArray) {
                        const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
                        if (isObjectId) {
                            orConditionsForcategories.push({ "productCategory.category._id": new mongoose_1.default.Types.ObjectId(category) });
                            const findcategory = await category_model_1.default.findOne({ _id: category }, '_id');
                            if (findcategory && findcategory._id) {
                                // Function to recursively fetch category IDs and their children
                                async function fetchCategoryAndChildren(categoryId) {
                                    const categoriesData = await category_model_1.default.find({ parentCategory: categoryId }, '_id');
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
                        else {
                            orConditionsForcategories.push({ "productCategory.category.slug": category });
                            const findcategory = await category_model_1.default.findOne({ slug: category }, '_id');
                            if (findcategory && findcategory._id) {
                                // Function to recursively fetch category IDs and their children
                                async function fetchCategoryAndChildren(categoryId) {
                                    const categoriesData = await category_model_1.default.find({ parentCategory: categoryId }, '_id');
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
                    const attributeArray = attribute.split(',');
                    for await (let attribute of attributeArray) {
                        const isObjectId = /^[0-9a-fA-F]{24}$/.test(attribute);
                        if (isObjectId) {
                            orConditionsForAttributes.push({ "productVariants.productVariantAttributes.attributeDetail._id": new mongoose_1.default.Types.ObjectId(attribute) });
                        }
                        else {
                            orConditionsForAttributes.push({ "productVariants.productVariantAttributes.attributeDetail.itemName": attribute });
                        }
                    }
                }
                if (specification) {
                    const specificationArray = specification.split(',');
                    for await (let specification of specificationArray) {
                        const isObjectId = /^[0-9a-fA-F]{24}$/.test(attribute);
                        if (isObjectId) {
                            orConditionsForSpecification.push({ "productVariants.productSpecification.specificationDetail._id": new mongoose_1.default.Types.ObjectId(specification) });
                        }
                        else {
                            orConditionsForSpecification.push({ "productVariants.productSpecification.specificationDetail.itemName": specification });
                        }
                    }
                }
                if (brands) {
                    const brandArray = brands.split(',');
                    for await (let brand of brandArray) {
                        const isObjectId = /^[0-9a-fA-F]{24}$/.test(brand);
                        if (isObjectId) {
                            orConditionsForBrands.push({ "brand._id": new mongoose_1.default.Types.ObjectId(brand) });
                        }
                        else {
                            orConditionsForBrands.push({ "brand.slug": brand });
                        }
                    }
                }
                if (category) {
                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
                    if (isObjectId) {
                        orConditionsForcategory.push({ "productCategory.category._id": new mongoose_1.default.Types.ObjectId(category) });
                        const findcategory = await category_model_1.default.findOne({ _id: category }, '_id');
                        if (findcategory && findcategory._id) {
                            // Function to recursively fetch category IDs and their children
                            async function fetchCategoryAndChildren(categoryId) {
                                const categoriesData = await category_model_1.default.find({ parentCategory: categoryId }, '_id');
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
                        }
                        else {
                            query = {
                                ...query, "productCategory.category._id": new mongoose_1.default.Types.ObjectId(category)
                            };
                        }
                    }
                    else {
                        orConditionsForcategory.push({ "productCategory.category.slug": category });
                        const findcategory = await category_model_1.default.findOne({ slug: category }, '_id');
                        if (findcategory && findcategory._id) {
                            // Function to recursively fetch category IDs and their children
                            async function fetchCategoryAndChildren(categoryId) {
                                const categoriesData = await category_model_1.default.find({ parentCategory: categoryId }, '_id');
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
                        }
                        else {
                            // If category not found, fallback to direct query by slug
                            query = {
                                ...query, "productCategory.category.slug": category
                            };
                        }
                    }
                }
                if (brand) {
                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
                    if (isObjectId) {
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
                if (collectionproduct) {
                    products = {
                        ...products, collectionproduct: new mongoose_1.default.Types.ObjectId(collectionproduct)
                    };
                }
                if (collectionbrand) {
                    products = {
                        ...products, collectionbrand: new mongoose_1.default.Types.ObjectId(collectionbrand)
                    };
                }
                if (collectioncategory) {
                    products = {
                        ...products, collectioncategory: new mongoose_1.default.Types.ObjectId(collectioncategory)
                    };
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
                const productData = await product_service_1.default.findProductList({
                    page: parseInt(page_size),
                    limit: parseInt(limit),
                    query,
                    sort,
                    products,
                    discount,
                    offers,
                    getimagegallery,
                    getattribute,
                    getspecification,
                    getSeo,
                    hostName: req.get('host'),
                });
                if (sortby == "price") {
                    productData.sort((a, b) => {
                        const aPrice = a.productVariants[0]?.[sortby] || 0;
                        const bPrice = b.productVariants[0]?.[sortby] || 0;
                        if (sortorder === 'asc') {
                            return aPrice - bPrice;
                        }
                        else {
                            return bPrice - aPrice;
                        }
                    });
                }
                const totalProductData = await product_service_1.default.findProductList({
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
}
exports.default = new ProductController();

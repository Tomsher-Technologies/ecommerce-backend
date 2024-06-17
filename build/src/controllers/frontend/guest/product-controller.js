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
            const { category = '', brand = '', collectionproduct = '', collectionbrand = '', collectioncategory = '' } = req.query;
            let query = { _id: { $exists: true } };
            let products;
            query.status = '1';
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
            });
            return controller.sendSuccessResponse(res, {
                requestedData: attributes,
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching attributes' });
        }
    }
    async findAllSpecifications(req, res) {
        try {
            const { category = '', brand = '', collectionproduct = '', collectionbrand = '', collectioncategory = '' } = req.query;
            let query = { _id: { $exists: true } };
            let products;
            query.status = '1';
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
                products
            });
            return controller.sendSuccessResponse(res, {
                requestedData: specifications,
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching specifications' });
        }
    }
    async findProductDetail(req, res) {
        try {
            const productId = req.params.id;
            if (productId) {
                const product = await product_service_1.default.findOne(productId, { hostName: req.get('origin') });
                if (product) {
                    controller.sendSuccessResponse(res, {
                        requestedData: {
                            ...product
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
            const { page_size = 1, limit = 10, keyword = '', category = '', brand = '', collectionproduct = '', collectionbrand = '', collectioncategory = '', getImageGallery = 0, categories = '', brands = '', attribute = '', specification = '', offer = '', sortby = '', sortorder = '', maxprice = '', minprice = '', discount = '', getattribute = '', getspecification = '' } = req.query;
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
            const orConditionsForcategories = [];
            const orConditionsForSpecification = [];
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
                        }
                        else {
                            orConditionsForcategories.push({ "productCategory.category.slug": category });
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
                        const findcategory = await category_model_1.default.findOne({ slug: category }, '_id');
                        if (findcategory && findcategory._id) {
                            const categoriesData = await category_model_1.default.find({ parentCategory: findcategory._id }, '_id');
                            const categoryIds = categoriesData.map(category => category._id);
                            for await (let id of categoryIds) {
                                orConditionsForcategories.push({ "productCategory.category._id": new mongoose_1.default.Types.ObjectId(id) });
                            }
                        }
                        else {
                            query = {
                                ...query, "productCategory.category._id": new mongoose_1.default.Types.ObjectId(category)
                            };
                        }
                    }
                    else {
                        const findcategory = await category_model_1.default.findOne({ slug: category }, '_id');
                        if (findcategory && findcategory._id) {
                            const categoriesData = await category_model_1.default.find({ parentCategory: findcategory._id }, '_id');
                            const categoryIds = categoriesData.map(category => category._id);
                            for await (let id of categoryIds) {
                                orConditionsForcategories.push({ "productCategory.category._id": new mongoose_1.default.Types.ObjectId(id) });
                            }
                        }
                        else {
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
                if (orConditionsForAttributes.length > 0 || orConditionsForBrands.length > 0 || orConditionsForcategories.length > 0) {
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
                    getImageGallery,
                    getattribute,
                    getspecification,
                    getSeo,
                    getCategory,
                    getBrand,
                    hostName: req.get('origin'),
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
                return controller.sendSuccessResponse(res, {
                    requestedData: productData,
                    totalCount: productData.length,
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

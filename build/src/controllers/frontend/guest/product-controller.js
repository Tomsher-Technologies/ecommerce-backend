"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const base_controller_1 = __importDefault(require("../../admin/base-controller"));
const product_service_1 = __importDefault(require("../../../services/frontend/guest/product-service"));
const controller = new base_controller_1.default();
class ProductController extends base_controller_1.default {
    async findAllAttributes(req, res) {
        try {
            const { category = '', brand = '' } = req.query;
            let query = { _id: { $exists: true } };
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
            const attributes = await product_service_1.default.findAllAttributes({
                hostName: req.get('host'),
                query,
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
            const { category = '', brand = '' } = req.query;
            let query = { _id: { $exists: true } };
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
            const specifications = await product_service_1.default.findAllSpecifications({
                hostName: req.get('origin'),
                query,
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
                const product = await product_service_1.default.findOne(productId, { hostName: req.get('host') });
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
            const { category = '', brand = '', collectionproduct = '', collectionbrand = '', collectioncategory = '', getImageGallery = 0, getAttribute = 0, categories = '', brands = '', offer = '' } = req.query;
            let getSpecification = '1';
            let getSeo = '1';
            let getBrand = '1';
            let getCategory = '1';
            let query = { _id: { $exists: true } };
            let products;
            let offers;
            query.status = '1';
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
                const orConditions = [];
                for await (let category of categoryArray) {
                    const keywordRegex = new RegExp(category, 'i');
                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
                    if (isObjectId) {
                        orConditions.push({ "productCategory.category._id": new mongoose_1.default.Types.ObjectId(category) });
                    }
                    else {
                        orConditions.push({ "productCategory.category.slug": keywordRegex });
                    }
                    if (orConditions.length > 0) {
                        query = {
                            ...query,
                            $or: orConditions
                        };
                    }
                }
            }
            if (brands) {
                const brandArray = brands.split(',');
                const orConditions = [];
                for await (let brand of brandArray) {
                    const keywordRegex = new RegExp(brand, 'i');
                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(brand);
                    if (isObjectId) {
                        orConditions.push({ "brand._id": new mongoose_1.default.Types.ObjectId(brand) });
                    }
                    else {
                        orConditions.push({ "brand.slug": keywordRegex });
                    }
                    if (orConditions.length > 0) {
                        query = {
                            ...query,
                            $or: orConditions
                        };
                    }
                }
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
            const productData = await product_service_1.default.findProductList({
                query,
                products,
                offers,
                getImageGallery,
                getAttribute,
                getSpecification,
                getSeo,
                getCategory,
                getBrand,
                hostName: req.get('host'),
            });
            return controller.sendSuccessResponse(res, {
                requestedData: productData,
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching specifications' });
        }
    }
}
exports.default = new ProductController();

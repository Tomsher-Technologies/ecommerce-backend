"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const brand_service_1 = __importDefault(require("../../../services/frontend/guest/brand-service"));
const common_service_1 = __importDefault(require("../../../services/frontend/guest/common-service"));
const category_model_1 = __importDefault(require("../../../model/admin/ecommerce/category-model"));
const controller = new base_controller_1.default();
class BrandController extends base_controller_1.default {
    async findAllBrand(req, res) {
        try {
            const { category = '', brand = '', collectionproduct = '', collectionbrand = '', collectioncategory = '', sortby = 'brandTitle', sortorder = 'asc' } = req.query;
            let query = {};
            const orConditionsForcategory = [];
            query.status = '1';
            let products;
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                const sort = {};
                if (sortby && sortorder) {
                    sort[sortby] = sortorder === 'desc' ? -1 : 1;
                }
                if (!brand) {
                    if (category) {
                        const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
                        if (isObjectId) {
                            orConditionsForcategory.push({ "productCategory.category._id": new mongoose_1.default.Types.ObjectId(category) });
                            const findcategory = await category_model_1.default.findOne({ _id: category }, '_id');
                            if (findcategory && findcategory._id) {
                                async function fetchCategoryAndChildren(categoryId) {
                                    const categoriesData = await category_model_1.default.find({ parentCategory: categoryId }, '_id');
                                    const categoryIds = categoriesData.map(category => category._id);
                                    for (let childId of categoryIds) {
                                        orConditionsForcategory.push({ "productCategory.category._id": childId });
                                        await fetchCategoryAndChildren(childId);
                                    }
                                }
                                await fetchCategoryAndChildren(findcategory._id);
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
                                async function fetchCategoryAndChildren(categoryId) {
                                    const categoriesData = await category_model_1.default.find({ parentCategory: categoryId }, '_id');
                                    const categoryIds = categoriesData.map(category => category._id);
                                    for (let childId of categoryIds) {
                                        orConditionsForcategory.push({ "productCategory.category._id": childId });
                                        await fetchCategoryAndChildren(childId);
                                    }
                                }
                                await fetchCategoryAndChildren(findcategory._id);
                                orConditionsForcategory.push({ "productCategory.category._id": findcategory._id });
                            }
                            else {
                                query = {
                                    ...query, "productCategory.category.slug": category
                                };
                            }
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
                }
                if (brand) {
                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(brand);
                    if (isObjectId) {
                        query = {
                            ...query, _id: new mongoose_1.default.Types.ObjectId(brand)
                        };
                    }
                    else {
                        query = {
                            ...query, slug: brand
                        };
                    }
                }
                if (orConditionsForcategory.length > 0) {
                    query.$and = [];
                    query.$and.push({
                        $or: orConditionsForcategory
                    });
                }
                const brands = await brand_service_1.default.findAll({
                    hostName: req.get('origin'),
                    query,
                    sort
                }, products);
                return controller.sendSuccessResponse(res, {
                    requestedData: brands,
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
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching brands' });
        }
    }
}
exports.default = new BrandController();

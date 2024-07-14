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
const product_category_link_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-category-link-model"));
const product_model_1 = __importDefault(require("../../../model/admin/ecommerce/product-model"));
const controller = new base_controller_1.default();
class BrandController extends base_controller_1.default {
    async findAllBrand(req, res) {
        try {
            const { category = '', brand = '', collectionproduct = '', collectionbrand = '', collectioncategory = '' } = req.query;
            let query = {};
            query.status = '1';
            let collectionId;
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                if (!brand) {
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
                            const categoryProductsIds = await product_category_link_model_1.default.find({ categoryId: { $in: categoryIds } }).select('productId');
                            if (categoryProductsIds && categoryProductsIds.length > 0) {
                                const brandIds = await product_model_1.default.find({ _id: { $in: categoryProductsIds.map((categoryProductsId) => categoryProductsId.productId) } }).select('brand');
                                query = {
                                    ...query, "_id": { $in: brandIds.map((brandId) => brandId.brand) }
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
                const brands = await brand_service_1.default.findAll({
                    hostName: req.get('origin'),
                    query,
                }, collectionId);
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

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const seo_page_1 = require("../../../constants/admin/seo-page");
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const category_service_1 = __importDefault(require("../../../services/frontend/guest/category-service"));
const common_service_1 = __importDefault(require("../../../services/frontend/guest/common-service"));
const seo_page_model_1 = __importDefault(require("../../../model/admin/seo-page-model"));
const controller = new base_controller_1.default();
class CategoryController extends base_controller_1.default {
    async findAllCategory(req, res) {
        try {
            const { category = '', sortby = 'categoryTitle', sortorder = 'asc' } = req.query;
            const level = '0';
            let query = { _id: { $exists: true } };
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                const sort = {};
                if (sortby && sortorder) {
                    sort[sortby] = sortorder === 'desc' ? -1 : 1;
                }
                query.status = '1';
                if (category) {
                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
                    if (isObjectId) {
                        query = {
                            ...query, _id: new mongoose_1.default.Types.ObjectId(category)
                        };
                    }
                    else {
                        query = {
                            ...query, slug: category
                        };
                    }
                }
                else {
                    query = {
                        ...query, level: level
                    };
                }
                const categories = await category_service_1.default.findAll({
                    hostName: req.get('origin'),
                    query,
                    sort
                });
                return controller.sendSuccessResponse(res, {
                    requestedData: categories,
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
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching categories' });
        }
    }
    async findOne(req, res) {
        try {
            const categoryId = req.params.slug;
            if (categoryId) {
                const category = await category_service_1.default.findOne(categoryId, req.get('origin'));
                const { getSeo = '0' } = req.query;
                if (getSeo === '1' && category) {
                    const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
                    const seoQuery = {
                        _id: { $exists: true },
                        pageId: category._id,
                        pageReferenceId: new mongoose_1.default.Types.ObjectId(countryId),
                        page: seo_page_1.seoPage.ecommerce.categories,
                    };
                    const seoDetails = await seo_page_model_1.default.find(seoQuery);
                    if (seoDetails && seoDetails.length > 0) {
                        const seoFields = ['metaTitle', 'metaKeywords', 'metaDescription', 'ogTitle', 'ogDescription', 'twitterTitle', 'twitterDescription'];
                        const seoData = seoDetails[0];
                        seoFields.forEach((field) => {
                            if (seoData[field] && seoData[field] !== '') {
                                category[field] = seoData[field];
                            }
                        });
                    }
                }
                return controller.sendSuccessResponse(res, {
                    requestedData: category,
                    message: 'Success'
                });
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Category Id not found!',
                });
            }
        }
        catch (error) {
            controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
}
exports.default = new CategoryController();

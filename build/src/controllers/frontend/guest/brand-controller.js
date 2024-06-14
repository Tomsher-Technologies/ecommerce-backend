"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const brand_service_1 = __importDefault(require("../../../services/frontend/guest/brand-service"));
const common_service_1 = __importDefault(require("../../../services/frontend/guest/common-service"));
const controller = new base_controller_1.default();
class BrandController extends base_controller_1.default {
    async findAllBrand(req, res) {
        try {
            const { category = '', brand = '', collectionproduct = '', collectionbrand = '', collectioncategory = '' } = req.query;
            let query = { _id: { $exists: true } };
            query.status = '1';
            let products;
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                if (!brand) {
                    if (category) {
                        const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
                        if (isObjectId) {
                            query = {
                                ...query, "productCategory.category._id": new mongoose_1.default.Types.ObjectId(category)
                            };
                        }
                        else {
                            query = {
                                ...query, "productCategory.category.slug": category
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
                }
                if (brand) {
                    console.log("jkkjkjkjkkjkjkj", brand);
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
                    query
                }, products);
                console.log(query);
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

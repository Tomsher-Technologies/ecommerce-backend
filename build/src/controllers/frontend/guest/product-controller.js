"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const base_controller_1 = __importDefault(require("../../admin/base-controller"));
const product_service_1 = __importDefault(require("../../../services/frontend/guest/product-service"));
const helpers_1 = require("../../../utils/helpers");
const controller = new base_controller_1.default();
class ProductController extends base_controller_1.default {
    async findAllAttributes(req, res) {
        try {
            const { specification = '', specificationDetail = '', product = '', category = '', attribute = '', attributeDetail = '', brand = '' } = req.query;
            const userData = await res.locals.user;
            const countryId = (0, helpers_1.getCountryId)(userData);
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
            const products = await product_service_1.default.findAllAttributes({
                hostName: req.get('host'),
                query,
            });
            return controller.sendSuccessResponse(res, {
                requestedData: products,
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching attributes' });
        }
    }
}
exports.default = new ProductController();

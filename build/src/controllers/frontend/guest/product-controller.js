"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_controller_1 = __importDefault(require("../../admin/base-controller"));
const product_service_1 = __importDefault(require("../../../services/frontend/guest/product-service"));
const helpers_1 = require("../../../utils/helpers");
const products_1 = require("../../../utils/admin/products");
const controller = new base_controller_1.default();
class ProductController extends base_controller_1.default {
    async findAllAttributes(req, res) {
        try {
            const { keyword = '', specificationId = '', specificationDetailId = '', productId = '', categoryId = '', attributeId = '', attributeDetailId = '', brandId = '' } = req.query;
            const userData = await res.locals.user;
            const countryId = (0, helpers_1.getCountryId)(userData);
            const filterProducts = await (0, products_1.filterProduct)(req.query, countryId);
            console.log(filterProducts.query);
            filterProducts.query.status = '1';
            const products = await product_service_1.default.findAllAttributes({
                hostName: req.get('host'),
                query: filterProducts.query,
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

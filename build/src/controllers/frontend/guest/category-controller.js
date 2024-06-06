"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const category_service_1 = __importDefault(require("../../../services/frontend/guest/category-service"));
const controller = new base_controller_1.default();
class CategoryController extends base_controller_1.default {
    async findAll(req, res) {
        try {
            const { slug = '', category = '' } = req.query;
            const level = '0';
            let query = { _id: { $exists: true } };
            query.status = '1';
            if (slug) {
                const keywordRegex = new RegExp(slug, 'i');
                query = {
                    $or: [
                        { slug: keywordRegex },
                    ],
                    ...query
                };
            }
            if (category) {
                query = {
                    ...query, parentCategory: new mongoose_1.default.Types.ObjectId(category)
                };
            }
            else if (level) {
                query = {
                    ...query, level: level
                };
            }
            const categories = await category_service_1.default.findAll({
                hostName: req.get('host'),
                query,
            });
            return controller.sendSuccessResponse(res, {
                requestedData: categories,
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching categories' });
        }
    }
}
exports.default = new CategoryController();

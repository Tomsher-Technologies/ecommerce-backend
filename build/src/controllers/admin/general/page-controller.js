"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pages_1 = require("../../../constants/pages");
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const controller = new base_controller_1.default();
class PageController extends base_controller_1.default {
    async findAll(req, res) {
        try {
            return controller.sendSuccessResponse(res, {
                requestedData: {
                    page: pages_1.page,
                    pageReference: pages_1.pageReference,
                },
            }, 200);
        }
        catch (error) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching countries' });
        }
    }
}
exports.default = new PageController();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_controller_1 = __importDefault(require("../base-controller"));
const controller = new base_controller_1.default();
class GeneralController extends base_controller_1.default {
    async findPage(req, res) {
        try {
            // return controller.sendSuccessResponse(res, {
            //     page: page.page,
            //     pageReference: page.pageReference,
            //     linkType: page.linkType,
            // }, 200);
        }
        catch (error) {
            // return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching banners' });
        }
    }
}
exports.default = GeneralController;

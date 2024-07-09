"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_controller_1 = __importDefault(require("../admin/base-controller"));
const country_model_1 = __importDefault(require("../../model/admin/setup/country-model"));
const website_setup_model_1 = __importDefault(require("../../model/admin/setup/website-setup-model"));
const website_setup_1 = require("../../constants/website-setup");
const controller = new base_controller_1.default();
class CommonController extends base_controller_1.default {
    async getGeneralSettings(req, res) {
        const countryDetails = await country_model_1.default.findOne({ isOrigin: true });
        if (!countryDetails) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Country not set yet!',
            });
        }
        const websiteDetails = await website_setup_model_1.default.findOne({ countryId: countryDetails._id, blockReference: website_setup_1.blockReferences.websiteSettings });
        if (!websiteDetails) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Website details not found!',
            });
        }
        if (websiteDetails && websiteDetails?.blockValues && websiteDetails?.blockValues?.websiteLogoUrl) {
            return controller.sendSuccessResponse(res, {
                requestedData: websiteDetails?.blockValues,
                message: 'Website settings not found!'
            }, 200);
        }
        return controller.sendErrorResponse(res, 200, {
            message: 'Website settings not found!',
        });
    }
}
exports.default = new CommonController();

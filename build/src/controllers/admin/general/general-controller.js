"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const website_setup_1 = require("../../../constants/website-setup");
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const country_model_1 = __importDefault(require("../../../model/admin/setup/country-model"));
const website_setup_model_1 = __importDefault(require("../../../model/admin/setup/website-setup-model"));
const seo_page_model_1 = __importDefault(require("../../../model/admin/seo-page-model"));
const controller = new base_controller_1.default();
class GeneralController extends base_controller_1.default {
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
    async getPageSeoDetails(req, res) {
        try {
            const { pageId, pageReferenceId, page } = req.query;
            let query = { _id: { $exists: true } };
            if (pageId) {
                query.pageId = new mongoose_1.default.Types.ObjectId(pageId);
                if (pageReferenceId) {
                    query.pageReferenceId = new mongoose_1.default.Types.ObjectId(pageReferenceId);
                }
                if (page) {
                    query.page = page;
                }
                const seoDetails = await seo_page_model_1.default.find(query);
                return controller.sendSuccessResponse(res, {
                    requestedData: seoDetails,
                    message: 'Success!'
                }, 200);
            }
            else {
                controller.sendErrorResponse(res, 200, { message: 'Page id is required' });
            }
        }
        catch (error) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching categories seo' });
        }
    }
}
exports.default = new GeneralController();

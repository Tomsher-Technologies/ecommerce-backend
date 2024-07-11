"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("../../../utils/helpers");
const website_setup_1 = require("../../../constants/website-setup");
const base_controller_1 = __importDefault(require("../../admin/base-controller"));
const common_service_1 = __importDefault(require("../../../services/frontend/guest/common-service"));
const pages_service_1 = __importDefault(require("../../../services/frontend/guest/pages-service"));
const controller = new base_controller_1.default();
class PageController extends base_controller_1.default {
    async findPagesData(req, res) {
        try {
            const pageSlug = req.params.slug;
            if ((0, helpers_1.checkValueExists)(website_setup_1.blockReferences, pageSlug)) {
                let query = { _id: { $exists: true } };
                const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
                // let countryId = await CommonService.findOneCountrySubDomainWithId(hostName);
                if (countryId) {
                    query = {
                        ...query,
                        countryId,
                        block: website_setup_1.websiteSetup.pages,
                        blockReference: pageSlug,
                        status: '1',
                    };
                    const websiteSetup = await pages_service_1.default.findPagesData({
                        limit: 500,
                        hostName: req.get('origin'),
                        block: website_setup_1.websiteSetup.pages,
                        blockReference: pageSlug,
                        query,
                    });
                    return controller.sendSuccessResponse(res, {
                        requestedData: websiteSetup,
                        message: 'Success!'
                    }, 200);
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Error',
                        validation: 'block and blockReference is missing! please check'
                    }, req);
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'Invalid page'
                }, req);
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching ' });
        }
    }
}
exports.default = new PageController;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_controller_1 = __importDefault(require("../../admin/base-controller"));
const common_service_1 = __importDefault(require("../../../services/frontend/common-service"));
const controller = new base_controller_1.default();
class PageController extends base_controller_1.default {
    async findPagesData(req, res) {
        try {
            const pageSlug = req.params.slug;
            console.log('pageSlug', pageSlug);
            const { block, blockReference } = req.query;
            let query = { _id: { $exists: true } };
            const countryId = await common_service_1.default.findOneCountryShortTitleWithId(req.get('host'));
            if (countryId) {
                if (block && blockReference) {
                    query = {
                        ...query,
                        countryId,
                        block: { $in: block.split(',') },
                        blockReference: { $in: blockReference.split(',') },
                        status: '1',
                    };
                    const websiteSetup = await common_service_1.default.findWebsiteSetups({
                        limit: 500,
                        hostName: req.get('host'),
                        block,
                        blockReference,
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
                    validation: 'block and blockReference is missing! please check'
                }, req);
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching ' });
        }
    }
}
exports.default = new PageController;

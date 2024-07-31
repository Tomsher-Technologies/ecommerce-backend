"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const base_controller_1 = __importDefault(require("../base-controller"));
const contact_us_service_1 = __importDefault(require("../../../services/admin/website-information/contact-us-service"));
const contact_us_model_1 = __importDefault(require("../../../model/frontend/contact-us-model"));
const controller = new base_controller_1.default();
class ContactUsController extends base_controller_1.default {
    async findAll(req, res) {
        try {
            const { page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '', page = '', pageReference = '', countryId = '' } = req.query;
            let query = { _id: { $exists: true } };
            const userData = await res.locals.user;
            // const country = getCountryId(userData);
            // if (country) {
            //     query.countryId = country;
            // } else if (countryId) {
            //     query.countryId = new mongoose.Types.ObjectId(countryId)
            // }
            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            }
            else {
                query.status = '1';
            }
            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = {
                    $or: [
                        { email: keywordRegex }
                    ],
                    ...query
                };
            }
            if (page) {
                query = {
                    ...query, page: page
                };
            }
            if (pageReference) {
                query = {
                    ...query, pageReference: pageReference
                };
            }
            const sort = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const contactUs = await contact_us_service_1.default.findAll({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort
            });
            return controller.sendSuccessResponse(res, {
                requestedData: contactUs,
                totalCount: await contact_us_service_1.default.getTotalCount(query),
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching contactUs' });
        }
    }
    async findOne(req, res) {
        try {
            const contactUsId = req.params.id;
            if (contactUsId) {
                const contactUs = await contact_us_model_1.default.findById(contactUsId);
                return controller.sendSuccessResponse(res, {
                    requestedData: contactUs,
                    message: 'Success'
                });
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Contact Us Id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
}
exports.default = new ContactUsController();

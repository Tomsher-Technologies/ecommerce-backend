"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const base_controller_1 = __importDefault(require("../base-controller"));
const newsletter_service_1 = __importDefault(require("../../../services/admin/website-information/newsletter-service"));
const controller = new base_controller_1.default();
class NewsletterController extends base_controller_1.default {
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
                        { sliderTitle: keywordRegex }
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
            const sliders = await newsletter_service_1.default.findAll({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort
            });
            return controller.sendSuccessResponse(res, {
                requestedData: sliders,
                totalCount: await newsletter_service_1.default.getTotalCount(query),
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching sliders' });
        }
    }
}
exports.default = new NewsletterController();

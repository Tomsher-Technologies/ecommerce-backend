"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const helpers_1 = require("../../../utils/helpers");
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const order_report_service_1 = __importDefault(require("../../../services/admin/report/order-report-service"));
const controller = new base_controller_1.default();
class OrdersController extends base_controller_1.default {
    async orderReport(req, res) {
        try {
            const { page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', fromDate, endDate } = req.query;
            let query = { cartStatus: { $ne: "1" } };
            const userData = await res.locals.user;
            const countryId = await (0, helpers_1.getCountryIdWithSuperAdmin)(userData);
            if (countryId) {
                query.countryId = countryId;
            }
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let currentDate = new Date();
            currentDate.setHours(0, 59, 59, 59);
            today.setDate(today.getDate() - 7);
            if (!fromDate || !endDate) {
                query.orderStatusAt = {
                    ...(today && { $gte: today }),
                    ...(today && { $lte: currentDate })
                };
            }
            else {
                query.orderStatusAt = {
                    ...(fromDate && { $gte: new Date(fromDate) }),
                    ...(endDate && { $lte: (0, helpers_1.dateConvertPm)(endDate) })
                };
            }
            const sort = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const order = await order_report_service_1.default.orderReport({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort
            });
            return controller.sendSuccessResponse(res, {
                requestedData: order,
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching coupons' });
        }
    }
}
exports.default = new OrdersController();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const helpers_1 = require("../../../utils/helpers");
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const dashboard_service_1 = __importDefault(require("../../../services/admin/dashboard/dashboard-service"));
const controller = new base_controller_1.default();
class DashboardController extends base_controller_1.default {
    async dashboard(req, res) {
        try {
            const { page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '', fromDate = '', endDate = '' } = req.query;
            let query = { _id: { $exists: true } };
            const userData = await res.locals.user;
            const countryId = (0, helpers_1.getCountryId)(userData);
            if (countryId) {
                query.countryId = countryId;
            }
            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            }
            else {
                query.status = '1';
            }
            let salesQuery = {};
            if (fromDate || endDate) {
                salesQuery.createdAt = {
                    ...(fromDate && { $gte: new Date(fromDate) }),
                    ...(endDate && { $lte: (0, helpers_1.dateConvertPm)(endDate) })
                };
            }
            const sort = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const dashboard = await dashboard_service_1.default.findAll({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort
            });
            const salesComparison = await dashboard_service_1.default.findSalesComparison({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort
            });
            console.log("...........", query);
            const totalSales = await dashboard_service_1.default.findTotalSales({
                salesQuery,
                fromDate,
                endDate
            });
            const totalOrders = await dashboard_service_1.default.findTotalOrder({
                salesQuery,
                fromDate,
                endDate
            });
            controller.sendSuccessResponse(res, {
                requestedData: {
                    overViewCount: dashboard,
                    salesComparison: salesComparison,
                    totalSales: totalSales,
                    totalOrders: totalOrders
                },
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching coupons' });
        }
    }
}
exports.default = new DashboardController();

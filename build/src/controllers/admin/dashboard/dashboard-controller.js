"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const mongoose_1 = __importDefault(require("mongoose"));
const helpers_1 = require("../../../utils/helpers");
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const customer_service_1 = __importDefault(require("../../../services/admin/customer/customer-service"));
const dashboard_service_1 = __importDefault(require("../../../services/admin/dashboard/dashboard-service"));
const order_service_1 = __importDefault(require("../../../services/admin/order/order-service"));
const controller = new base_controller_1.default();
class DashboardController {
    async dashboardOrder(req, res) {
        try {
            const { page_size = 1, limit = 10, sortby = '', sortorder = '', countryId = '' } = req.query;
            let query = { _id: { $exists: true } };
            const userData = await res.locals.user;
            query = { cartStatus: { $ne: "1" } };
            const country = (0, helpers_1.getCountryId)(userData);
            if (country) {
                query.countryId = country;
            }
            else if (countryId) {
                query.countryId = new mongoose_1.default.Types.ObjectId(countryId);
            }
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let currentDate = new Date();
            currentDate.setHours(0, 59, 59, 59);
            today.setDate(today.getDate() - 7);
            const dashboard = await dashboard_service_1.default.findAll({
                query,
            });
            const salesComparison = await dashboard_service_1.default.findSalesComparison({
                query,
            });
            const sort = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const order = await order_service_1.default.OrderList({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort
            });
            console.log({
                overViewCount: dashboard,
                salesAndOrderComparison: salesComparison,
                lastOrders: order
            });
            controller.sendSuccessResponse(res, {
                requestedData: {
                    overViewCount: dashboard,
                    salesAndOrderComparison: salesComparison,
                    lastOrders: order
                },
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching coupons' });
        }
    }
    async dashboardAnalytics(req, res) {
        try {
            const { fromDate, endDate } = req.query;
            let query = { _id: { $exists: true } };
            const userData = await res.locals.user;
            const countryId = (0, helpers_1.getCountryId)(userData);
            if (countryId) {
                query.countryId = countryId;
            }
            query = { cartStatus: { $ne: "1" } };
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let salesQuery = {};
            let currentDate = new Date();
            currentDate.setHours(0, 59, 59, 59);
            today.setDate(today.getDate() - 7);
            if (!fromDate || !endDate) {
                salesQuery.createdAt = {
                    ...(today && { $gte: today }),
                    ...(today && { $lte: currentDate })
                };
            }
            else {
                salesQuery.createdAt = {
                    ...(fromDate && { $gte: new Date(fromDate) }),
                    ...(endDate && { $lte: (0, helpers_1.dateConvertPm)(endDate) })
                };
            }
            const totalSales = await dashboard_service_1.default.findTotalSales({
                salesQuery,
                fromDate: fromDate ? fromDate : today,
                endDate: endDate ? endDate : currentDate
            });
            const totalOrders = await dashboard_service_1.default.findTotalOrder({
                salesQuery,
                fromDate: fromDate ? fromDate : today,
                endDate: endDate ? endDate : currentDate
            });
            controller.sendSuccessResponse(res, {
                requestedData: {
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
    async dashboardCustomers(req, res) {
        try {
            const { page_size = 1, limit = 10, sortby = '', sortorder = '' } = req.query;
            let query = { _id: { $exists: true } };
            const userData = await res.locals.user;
            const countryId = (0, helpers_1.getCountryId)(userData);
            if (countryId) {
                query.countryId = countryId;
            }
            const sort = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const customers = await customer_service_1.default.findAll({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort,
                includeLookups: "1"
            });
            controller.sendSuccessResponse(res, {
                requestedData: customers[0].customerData,
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching coupons' });
        }
    }
}
exports.default = new DashboardController();

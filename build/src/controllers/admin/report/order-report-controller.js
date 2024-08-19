"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const helpers_1 = require("../../../utils/helpers");
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const order_report_service_1 = __importDefault(require("../../../services/admin/report/order-report-service"));
const cart_order_model_1 = __importDefault(require("../../../model/frontend/cart-order-model"));
const order_1 = require("../../../utils/admin/order");
const cart_1 = require("../../../constants/cart");
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
    async getMonthlyOrderReport(req, res) {
        try {
            const { orderStatus = '' } = req.query;
            const monthName = req.query.monthName;
            let query = { _id: { $exists: true } };
            let startDate;
            let endDate;
            let statusField;
            if (monthName) {
                const monthMap = {
                    January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
                    July: 6, August: 7, September: 8, October: 9, November: 10, December: 11
                };
                if (!monthMap.hasOwnProperty(monthName)) {
                    return controller.sendErrorResponse(res, 400, 'Invalid month name');
                }
                const month = monthMap[monthName];
                const currentYear = new Date().getFullYear();
                startDate = new Date(currentYear, month, 1);
                endDate = new Date(currentYear, month + 1, 0, 23, 59, 59, 999);
            }
            else {
                // If no monthName is provided, use the whole year
                const currentYear = new Date().getFullYear();
                startDate = new Date(currentYear, 0, 1); // January 1st
                endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999); // December 31st
            }
            if (orderStatus) {
                statusField = (0, order_1.findOrderStatusDateCheck)(cart_1.orderStatusMap[orderStatus]?.value);
                if (statusField) {
                    query[statusField] = {
                        $gte: startDate || new Date(0),
                        $lte: endDate || new Date()
                    };
                }
                else {
                    return controller.sendErrorResponse(res, 400, 'Invalid order status');
                }
            }
            else {
                query.createdAt = {
                    $gte: startDate,
                    $lte: endDate
                };
            }
            const report = await cart_order_model_1.default.aggregate([
                {
                    $match: query
                },
                {
                    $group: {
                        _id: {
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" }
                        },
                        totalOrders: { $sum: 1 },
                        totalAmount: { $sum: "$totalAmount" },
                        totalDiscountAmount: { $sum: "$totalDiscountAmount" },
                        totalShippingAmount: { $sum: "$totalShippingAmount" },
                        totalTaxAmount: { $sum: "$totalTaxAmount" },
                        totalProductAmount: { $sum: "$totalProductAmount" },
                        totalCouponAmount: { $sum: "$totalCouponAmount" },
                    }
                },
                {
                    $addFields: {
                        monthYear: {
                            $dateToString: {
                                format: "%m-%Y", // Month-Year format
                                date: {
                                    $dateFromParts: {
                                        year: "$_id.year",
                                        month: "$_id.month",
                                        day: 1
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0, // Exclude _id
                        totalOrders: 1,
                        totalAmount: 1,
                        totalDiscountAmount: 1,
                        totalShippingAmount: 1,
                        totalTaxAmount: 1,
                        totalProductAmount: 1,
                        totalCouponAmount: 1,
                        monthYear: 1
                    }
                },
                {
                    $sort: {
                        monthYear: -1
                    }
                },
                // Calculate the totals across all documents
                {
                    $facet: {
                        data: [
                            { $match: {} }
                        ],
                        totals: [
                            {
                                $group: {
                                    _id: null,
                                    totalOrders: { $sum: "$totalOrders" },
                                    totalAmount: { $sum: "$totalAmount" },
                                    totalDiscountAmount: { $sum: "$totalDiscountAmount" },
                                    totalShippingAmount: { $sum: "$totalShippingAmount" },
                                    totalTaxAmount: { $sum: "$totalTaxAmount" },
                                    totalProductAmount: { $sum: "$totalProductAmount" },
                                    totalCouponAmount: { $sum: "$totalCouponAmount" }
                                }
                            },
                            {
                                $addFields: {
                                    monthYear: "Total"
                                }
                            }
                        ]
                    }
                },
                {
                    $project: {
                        data: 1,
                        totals: { $arrayElemAt: ["$totals", 0] }
                    }
                }
            ]);
            return controller.sendSuccessResponse(res, {
                requestedData: report[0].data,
                totalSummary: report[0].totals,
                message: 'Success!'
            }, 200);
        }
        catch (err) {
            console.error('Error generating monthly order report:', err);
            return controller.sendErrorResponse(res, 500, 'Error generating report');
        }
    }
    async getDailyOrderReport(req, res) {
        try {
            let query = { _id: { $exists: true } };
            const { orderStatus = '' } = req.query;
            const endDate = new Date();
            const startDate = new Date(0);
            let statusField;
            if (orderStatus) {
                statusField = (0, order_1.findOrderStatusDateCheck)(cart_1.orderStatusMap[orderStatus]?.value);
                if (statusField) {
                    query[statusField] = {
                        $gte: startDate,
                        $lte: endDate
                    };
                }
                else {
                    return controller.sendErrorResponse(res, 400, 'Invalid order status');
                }
            }
            else {
                query.orderStatusAt = {
                    $gte: startDate,
                    $lte: endDate
                };
            }
            const report = await cart_order_model_1.default.aggregate([
                {
                    $match: query
                },
                {
                    $group: {
                        _id: {
                            day: { $dayOfMonth: "$createdAt" },
                            month: { $month: "$createdAt" },
                            year: { $year: "$createdAt" }
                        },
                        totalOrders: { $sum: 1 },
                        totalAmount: { $sum: "$totalAmount" },
                        totalDiscountAmount: { $sum: "$totalDiscountAmount" },
                        totalShippingAmount: { $sum: "$totalShippingAmount" },
                        totalTaxAmount: { $sum: "$totalTaxAmount" },
                        totalProductAmount: { $sum: "$totalProductAmount" },
                        totalCouponAmount: { $sum: "$totalCouponAmount" },
                    }
                },
                {
                    $addFields: {
                        orderDate: {
                            $dateToString: {
                                format: "%Y-%m-%d", // Year-Month-Day format for sorting
                                date: {
                                    $dateFromParts: {
                                        year: "$_id.year",
                                        month: "$_id.month",
                                        day: "$_id.day"
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalOrders: 1,
                        totalAmount: 1,
                        totalDiscountAmount: 1,
                        totalShippingAmount: 1,
                        totalTaxAmount: 1,
                        totalProductAmount: 1,
                        totalCouponAmount: 1,
                        orderDate: 1
                    }
                },
                {
                    $sort: {
                        orderDate: -1 // Sort in descending order
                    }
                },
                {
                    $facet: {
                        data: [
                            { $match: {} }
                        ],
                        totals: [
                            {
                                $group: {
                                    _id: null,
                                    totalOrders: { $sum: "$totalOrders" },
                                    totalAmount: { $sum: "$totalAmount" },
                                    totalDiscountAmount: { $sum: "$totalDiscountAmount" },
                                    totalShippingAmount: { $sum: "$totalShippingAmount" },
                                    totalTaxAmount: { $sum: "$totalTaxAmount" },
                                    totalProductAmount: { $sum: "$totalProductAmount" },
                                    totalCouponAmount: { $sum: "$totalCouponAmount" }
                                }
                            },
                            {
                                $addFields: {
                                    orderDate: "Total"
                                }
                            }
                        ]
                    }
                },
                // Combine results from `data` and `totals` facets
                {
                    $project: {
                        data: 1,
                        totals: { $arrayElemAt: ["$totals", 0] }
                    }
                }
            ]);
            return controller.sendSuccessResponse(res, {
                requestedData: report[0].data,
                totalSummary: report[0].totals,
                message: 'Success!'
            }, 200);
        }
        catch (err) {
            console.error('Error generating daily order report:', err);
            return controller.sendErrorResponse(res, 500, 'Error generating report');
        }
    }
}
exports.default = new OrdersController();

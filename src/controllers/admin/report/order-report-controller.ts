import 'module-alias/register';
import { Request, Response } from 'express';
import { dateConvertPm, getCountryIdWithSuperAdmin } from '../../../utils/helpers';

import BaseController from '../../../controllers/admin/base-controller';
import { DashboardQueryParams } from '../../../utils/types/dashboard';
import OrderReportService from '../../../services/admin/report/order-report-service';
import CartOrdersModel from '../../../model/frontend/cart-order-model';
import { findOrderStatusDateCheck } from '../../../utils/admin/order';
import { orderStatusMap } from '../../../constants/cart';
import { OrderQueryParams } from '../../../utils/types/order';

const controller = new BaseController();

class OrdersController extends BaseController {

    async orderReport(req: Request, res: Response): Promise<void> {
        try {

            const { page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', fromDate, endDate } = req.query as DashboardQueryParams;
            let query: any = { cartStatus: { $ne: "1" } }

            const userData = await res.locals.user;
            const countryId = await getCountryIdWithSuperAdmin(userData);
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
            } else {
                query.orderStatusAt = {
                    ...(fromDate && { $gte: new Date(fromDate) }),
                    ...(endDate && { $lte: dateConvertPm(endDate) })
                };
            }

            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const order = await OrderReportService.orderReport({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            return controller.sendSuccessResponse(res, {
                requestedData: order,
                message: 'Success!'
            }, 200);

        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching coupons' });
        }
    }

    async getMonthlyOrderReport(req: Request, res: Response) {
        try {
            const { orderStatus = '' } = req.query as OrderQueryParams;
            const monthName: any = req.query.monthName;

            let query: any = { _id: { $exists: true } };
            let startDate: Date | undefined;
            let endDate: Date | undefined;
            let statusField: any;

            if (monthName) {
                const monthMap: any = {
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
            } else {
                // If no monthName is provided, use the whole year
                const currentYear = new Date().getFullYear();
                startDate = new Date(currentYear, 0, 1); // January 1st
                endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999); // December 31st
            }

            if (orderStatus) {
                statusField = findOrderStatusDateCheck(orderStatusMap[orderStatus]?.value);
                if (statusField) {
                    query[statusField] = {
                        $gte: startDate || new Date(0),
                        $lte: endDate || new Date()
                    };
                } else {
                    return controller.sendErrorResponse(res, 400, 'Invalid order status');
                }
            } else {
                query.createdAt = {
                    $gte: startDate,
                    $lte: endDate
                };
            }

            const report = await CartOrdersModel.aggregate([
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
        } catch (err) {
            console.error('Error generating monthly order report:', err);
            return controller.sendErrorResponse(res, 500, 'Error generating report');
        }
    }

    async getDailyOrderReport(req: Request, res: Response) {
        try {
            let query: any = { _id: { $exists: true } };
            const { orderStatus = '' } = req.query as OrderQueryParams;

            const endDate = new Date();
            const startDate = new Date(0);

            let statusField: string | undefined;
            if (orderStatus) {
                statusField = findOrderStatusDateCheck(orderStatusMap[orderStatus]?.value);
                if (statusField) {
                    query[statusField] = {
                        $gte: startDate,
                        $lte: endDate
                    };
                } else {
                    return controller.sendErrorResponse(res, 400, 'Invalid order status');
                }
            } else {
                query.orderStatusAt = {
                    $gte: startDate,
                    $lte: endDate
                };
            }

            const report = await CartOrdersModel.aggregate([
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
        } catch (err) {
            console.error('Error generating daily order report:', err);
            return controller.sendErrorResponse(res, 500, 'Error generating report');
        }
    }


}

export default new OrdersController();


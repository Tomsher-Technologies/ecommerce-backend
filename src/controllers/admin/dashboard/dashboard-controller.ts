import 'module-alias/register';
import { Request, Response } from 'express';
import mongoose from 'mongoose';

import { dateConvertPm, getCountryId } from '../../../utils/helpers';

import BaseController from '../../../controllers/admin/base-controller';
import CustomerService from '../../../services/admin/customer/customer-service'

import { QueryParams } from '../../../utils/types/common';
import DashboardService from '../../../services/admin/dashboard/dashboard-service';
import { DashboardQueryParams } from '../../../utils/types/dashboard';
import OrderService from '../../../services/admin/order/order-service'
import { OrderQueryParams } from '../../../utils/types/order';

const controller = new BaseController();

class DashboardController {

    async dashboardOrder(req: Request, res: Response): Promise<void> {
        try {

            const { page_size = 1, limit = 10, sortby = '', sortorder = '', countryId = '' } = req.query as OrderQueryParams;

            let query: any = { _id: { $exists: true } };

            const userData = await res.locals.user;
            query = { cartStatus: { $ne: "1" } }
            const country = getCountryId(userData);
            if (country) {
                query.countryId = country;
            }
            else if (countryId) {
                query.countryId = new mongoose.Types.ObjectId(countryId)
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let currentDate = new Date();
            currentDate.setHours(0, 59, 59, 59);
            today.setDate(today.getDate() - 7);

            const dashboard = await DashboardService.findAll({
                query,
            });

            const salesComparison = await DashboardService.findSalesComparison({
                query,
            });

            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const order = await OrderService.OrderList({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
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


        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching coupons' });
        }
    }

    async dashboardAnalytics(req: Request, res: Response): Promise<void> {
        try {
            const { fromDate, endDate } = req.query as DashboardQueryParams;
            let query: any = { _id: { $exists: true } };

            const userData = await res.locals.user;
            const countryId = getCountryId(userData);

            if (countryId) {
                query.countryId = countryId;
            }
            query = { cartStatus: { $ne: "1" } }
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let salesQuery: any = {}

            let currentDate = new Date();
            currentDate.setHours(0, 59, 59, 59);
            today.setDate(today.getDate() - 7);


            if (!fromDate || !endDate) {
                salesQuery.createdAt = {
                    ...(today && { $gte: today }),
                    ...(today && { $lte: currentDate })
                };
            } else {
                salesQuery.createdAt = {
                    ...(fromDate && { $gte: new Date(fromDate) }),
                    ...(endDate && { $lte: dateConvertPm(endDate) })
                };
            }

            const totalSales = await DashboardService.findTotalSales({
                salesQuery,
                fromDate: fromDate ? fromDate : today,
                endDate: endDate ? endDate : currentDate
            });

            const totalOrders = await DashboardService.findTotalOrder({
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

        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching coupons' });
        }
    }

    async dashboardCustomers(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, sortby = '', sortorder = '' } = req.query as QueryParams;

            let query: any = { _id: { $exists: true } };

            const userData = await res.locals.user;
            const countryId = getCountryId(userData);

            if (countryId) {
                query.countryId = countryId;
            }
            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const customers: any = await CustomerService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            controller.sendSuccessResponse(res, {
                requestedData: customers[0].customerData,
                message: 'Success!'
            }, 200);

        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching coupons' });
        }
    }

}

export default new DashboardController();


import 'module-alias/register';
import { Request, Response } from 'express';

import { dateConvertPm, getCountryId } from '../../../utils/helpers';

import BaseController from '../../../controllers/admin/base-controller';
import CustomerService from '../../../services/admin/customer/customer-service'

import { QueryParams } from '../../../utils/types/common';
import DashboardService from '../../../services/admin/dashboard/dashboard-service';
import { DashboardQueryParams } from '../../../utils/types/dashboard';

const controller = new BaseController();

class DashboardController extends BaseController {

    async dashboard(req: Request, res: Response): Promise<void> {
        try {

            const { page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '', fromDate = '', endDate = '' } = req.query as DashboardQueryParams;
            let query: any = { _id: { $exists: true } };

            const userData = await res.locals.user;
            const countryId = getCountryId(userData);

            if (countryId) {
                query.countryId = countryId;
            }

            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            } else {
                query.status = '1';
            }
            let salesQuery: any = {}
            if (fromDate || endDate) {
                salesQuery.createdAt = {
                    ...(fromDate && { $gte: new Date(fromDate) }),
                    ...(endDate && { $lte: dateConvertPm(endDate) })
                };

            }


            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const dashboard = await DashboardService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            const salesComparison = await DashboardService.findSalesComparison({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });
            console.log("...........", query);

            const totalSales = await DashboardService.findTotalSales({
                salesQuery,
                fromDate,
                endDate
            });

            const totalOrders = await DashboardService.findTotalOrder({
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

        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching coupons' });
        }
    }

}

export default new DashboardController();


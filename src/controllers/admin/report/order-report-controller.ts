import 'module-alias/register';
import { Request, Response } from 'express';
import { calculateExpectedDeliveryDate, dateConvertPm, formatZodError, getCountryId, getCountryIdWithSuperAdmin, handleFileUpload, slugify, stringToArray } from '../../../utils/helpers';

import BaseController from '../../../controllers/admin/base-controller';
import { DashboardQueryParams } from '../../../utils/types/dashboard';
import OrderReportService from '../../../services/admin/report/order-report-service';

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
}

export default new OrdersController();


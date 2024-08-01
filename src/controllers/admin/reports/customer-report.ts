import 'module-alias/register';
import { Request, Response } from 'express';

import { dateConvertPm, getCountryId } from '../../../utils/helpers';

import BaseController from '../base-controller';
import CustomerReportService from '../../../services/admin/reports/customer-report-service'

import { ReportQueryParams } from '../../../utils/types/report';

const controller = new BaseController();

class CustomerReportController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '', fromDate, endDate } = req.query as ReportQueryParams;
            let query: any = { _id: { $exists: true } };

            const userData = await res.locals.user;
            const countryId = getCountryId(userData);
            if (countryId) {
                query.countryId = countryId;
            }

            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = {
                    $or: [
                        { firstName: keywordRegex },
                        { email: keywordRegex }
                    ],
                    ...query
                } as any;
            }

            if (fromDate || endDate) {
                query.createdAt = {
                    ...(fromDate && { $gte: new Date(fromDate) }),
                    ...(endDate && { $lte: dateConvertPm(endDate) })
                };

            }

            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            } else {
                query.status = '1';
            }

            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const customer = await CustomerReportService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            controller.sendSuccessResponse(res, {
                requestedData: customer,
                totalCount: await CustomerReportService.getTotalCount(query),
                message: 'Success!'
            }, 200);

        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching coupons' });
        }
    }
}

export default new CustomerReportController();


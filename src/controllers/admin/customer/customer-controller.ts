import 'module-alias/register';
import { Request, Response } from 'express';

import { getCountryId } from '../../../utils/helpers';

import BaseController from '../../../controllers/admin/base-controller';
import CustomerService from '../../../services/admin/customer/customer-service'

import { QueryParams } from '../../../utils/types/common';

const controller = new BaseController();

class CustomerController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '' } = req.query as QueryParams;
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

            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const customer = await CustomerService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            controller.sendSuccessResponse(res, {
                requestedData: customer,
                totalCount: await CustomerService.getTotalCount(query),
                message: 'Success!'
            }, 200);

        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching coupons' });
        }
    }



    async findCustomer(req: Request, res: Response): Promise<void> {
        try {
            const customerId = req.params.id;
            if (customerId) {
                const customer = await CustomerService.findOne(customerId);

                return controller.sendSuccessResponse(res, {
                    requestedData: customer,
                    message: 'Success'
                });
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'customer not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }


}

export default new CustomerController();


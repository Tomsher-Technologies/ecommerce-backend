import 'module-alias/register';
import { Request, Response } from 'express';

import { QueryParams } from '../../../utils/types/common';

import BaseController from '../../../controllers/admin/base-controller';
import mongoose from 'mongoose';
import TransactionService from '../../../services/admin/order/transaction-service';
import { OrderQueryParams } from '../../../utils/types/order';
import { getCountryId } from '../../../utils/helpers';

const controller = new BaseController();

class TransactionsController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, sortby = '', sortorder = '', countryId, keyword = '', paymentMethodId = '', status = '', paymentTransactionId = '' } = req.query as OrderQueryParams;
            let query: any = { _id: { $exists: true } };

            const userData = await res.locals.user;
            const country = getCountryId(userData);

            if (country) {
                query.orders.country._id = country;
            } else if (countryId) {
                query = {
                    ...query, 'orders.country._id': new mongoose.Types.ObjectId(countryId)
                } as any;
            }

            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = {
                    $or: [
                        { 'paymentMethodId.paymentMethodTitle': keywordRegex },
                        { transactionId: keywordRegex },
                        { paymentId: keywordRegex },
                    ],
                    ...query
                } as any;
            }

            if (paymentMethodId) {
                query = {
                    ...query, 'paymentMethodId._id': new mongoose.Types.ObjectId(paymentMethodId)
                } as any;
            }

            if (paymentTransactionId) {
                query = {
                    ...query, _id: new mongoose.Types.ObjectId(paymentTransactionId)
                } as any;
            }

            if (status) {
                query = {
                    ...query, status: status
                } as any;
            } else {
                query = {
                    ...query, status: { $ne: "2" }
                } as any;
            }

            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }

            const transactions = await TransactionService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            controller.sendSuccessResponse(res, {
                requestedData: transactions,
                // totalCount: await SpecificationService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching transactions' });
        }
    }
}

export default new TransactionsController();
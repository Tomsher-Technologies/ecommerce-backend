import 'module-alias/register';
import { Request, Response } from 'express';

import { dateConvertPm, formatZodError, getCountryId, handleFileUpload, slugify, stringToArray } from '../../../utils/helpers';

import BaseController from '../../../controllers/admin/base-controller';
import CustomerService from '../../../services/admin/customer/customer-service'

import mongoose from 'mongoose';
import { OrderQueryParams } from '../../../utils/types/order';

const controller = new BaseController();

class CustomerController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, cartStatus = '', sortby = '', sortorder = '', keyword = '', countryId = '', customerId = '', pickupStoreId = '', paymentMethodId = '', couponId = '', orderFromDate, orderEndDate, processingFromDate, processingEndDate, packedFromDate, packedEndDate, shippedFromDate, shippedEndDate, deliveredFromDate, deliveredEndDate, canceledFromDate, canceledEndDate, returnedFromDate, returnedEndDate, refundedFromDate, refundedEndDate, partiallyShippedFromDate, partiallyShippedEndDate, onHoldFromDate, onHoldEndDate, failedFromDate, failedEndDate, completedFromDate, completedEndDate, pickupFromDate, pickupEndDate, cartFromDate, cartEndDate } = req.query as OrderQueryParams;
            let query: any = { _id: { $exists: true } };

            const userData = await res.locals.user;

            const country = getCountryId(userData);
            if (country) {
                query.countryId = country;
            } else if (countryId) {
                query.countryId = new mongoose.Types.ObjectId(countryId)
            }

            // if (status && status !== '') {
            //     query.status = { $in: Array.isArray(status) ? status : [status] };
            // } else {
            //     query.cartStatus = '1';
            // }

            query = { cartStatus: { $ne: "1" } }

            // { customerId: customerDetails._id },
            // { countryId: countryData._id },
            if (customerId) {
                query = {
                    ...query, customerId: new mongoose.Types.ObjectId(customerId)
                } as any;
            }


            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            console.log("************queryquery******", query);

            const order = await CustomerService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });
            console.log("******************", order);

            return controller.sendSuccessResponse(res, {
                requestedData: order,
                // totalCount: await CouponService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching coupons' });
        }
    }



    async findCustomer(req: Request, res: Response): Promise<void> {
        try {
            const customer = await CustomerService.findOne({
                status: '1',
            },
                '_id email firstName phone customerImageUrl referralCode totalRewardPoint totalWalletAmount isVerified status'
            );

            controller.sendSuccessResponse(res, {
                requestedData: customer,
                message: 'Success!'
            }, 200);



        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching customer' });
        }
    }


}

export default new CustomerController();


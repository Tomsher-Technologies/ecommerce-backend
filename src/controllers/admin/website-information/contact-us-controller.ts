import 'module-alias/register';
import { Request, Response } from 'express';

import { QueryParamsWithPage } from '../../../utils/types/common';

import BaseController from '../base-controller';

import ContactUsService from '../../../services/admin/website-information/contact-us-service';
import ContactUsModel from '../../../model/frontend/contact-us-model';

const controller = new BaseController();

class ContactUsController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '', page = '', pageReference = '', countryId = '' } = req.query as QueryParamsWithPage;
            let query: any = { _id: { $exists: true } };
            const userData = await res.locals.user;

            // const country = getCountryId(userData);
            // if (country) {
            //     query.countryId = country;
            // } else if (countryId) {
            //     query.countryId = new mongoose.Types.ObjectId(countryId)
            // }

            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            } else {
                query.status = '1';
            }

            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = {
                    $or: [
                        { email: keywordRegex }
                    ],
                    ...query
                } as any;
            }
            if (page) {
                query = {
                    ...query, page: page
                } as any;
            }

            if (pageReference) {
                query = {
                    ...query, pageReference: pageReference
                } as any;
            }
            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }

            const contactUs = await ContactUsService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            return controller.sendSuccessResponse(res, {
                requestedData: contactUs,
                totalCount: await ContactUsService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching contactUs' });
        }
    }

    async findOne(req: Request, res: Response): Promise<void> {
        try {
            const contactUsId = req.params.id;
            if (contactUsId) {
                const contactUs = await ContactUsModel.findById(contactUsId);
                return controller.sendSuccessResponse(res, {
                    requestedData: contactUs,
                    message: 'Success'
                });
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Contact Us Id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
}

export default new ContactUsController();
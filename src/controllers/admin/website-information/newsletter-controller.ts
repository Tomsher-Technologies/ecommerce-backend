import 'module-alias/register';
import { Request, Response } from 'express';

import { QueryParamsWithPage } from '../../../utils/types/common';

import BaseController from '../base-controller';

import NewsletterService from '../../../services/admin/website-information/newsletter-service';
import mongoose from 'mongoose';

const controller = new BaseController();

class NewsletterController extends BaseController {

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
                        { sliderTitle: keywordRegex }
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

            const sliders = await NewsletterService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            return controller.sendSuccessResponse(res, {
                requestedData: sliders,
                totalCount: await NewsletterService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching sliders' });
        }
    }



}

export default new NewsletterController();
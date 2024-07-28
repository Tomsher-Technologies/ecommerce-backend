import { Request, Response } from 'express';

import { blockReferences } from '../../../constants/website-setup';

import BaseController from '../../../controllers/admin/base-controller';
import CountryModel from '../../../model/admin/setup/country-model';
import WebsiteSetupModel from '../../../model/admin/setup/website-setup-model';
import SeoPageModel from '../../../model/admin/seo-page-model';
import mongoose from 'mongoose';

const controller = new BaseController();
class GeneralController extends BaseController {

    async getGeneralSettings(req: Request, res: Response): Promise<void> {

        const countryDetails: any = await CountryModel.findOne({ isOrigin: true });
        if (!countryDetails) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Country not set yet!',
            });
        }
        const websiteDetails: any = await WebsiteSetupModel.findOne({ countryId: countryDetails._id, blockReference: blockReferences.websiteSettings });
        if (!websiteDetails) {
            return controller.sendErrorResponse(res, 200, {
                message: 'Website details not found!',
            });
        }
        if (websiteDetails && websiteDetails?.blockValues && websiteDetails?.blockValues?.websiteLogoUrl) {
            return controller.sendSuccessResponse(res, {
                requestedData: websiteDetails?.blockValues,
                message: 'Website settings not found!'
            }, 200);
        }

        return controller.sendErrorResponse(res, 200, {
            message: 'Website settings not found!',
        });
    }

    async getPageSeoDetails(req: Request, res: Response) {
        try {
            const { pageId, pageReferenceId, page } = req.query as { pageId?: string; pageReferenceId?: string; page?: string };
            let query: any = { _id: { $exists: true } };
            if (pageId) {
                query.pageId = new mongoose.Types.ObjectId(pageId);
            }
            if (pageReferenceId) {
                query.pageReferenceId = new mongoose.Types.ObjectId(pageReferenceId);
            }
            if (page) {
                query.page = page;
            }
            const seoDetails = await SeoPageModel.find(query);
            controller.sendSuccessResponse(res, {
                requestedData: seoDetails,
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching categories seo' });
        }
    }

}

export default new GeneralController();
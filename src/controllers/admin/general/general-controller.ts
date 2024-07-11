import { Request, Response } from 'express';

import { page, pageReference } from '../../../constants/pages';

import BaseController from '../../../controllers/admin/base-controller';
import CountryModel from '../../../model/admin/setup/country-model';
import WebsiteSetupModel from '../../../model/admin/setup/website-setup-model';
import { blockReferences } from '../../../constants/website-setup';

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

}

export default new GeneralController();
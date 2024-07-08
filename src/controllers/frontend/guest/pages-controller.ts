import { Request, Response, response } from 'express';
import { CommonQueryParams } from '../../../utils/types/frontend/common';
import { checkValueExists } from '../../../utils/helpers';
import { blockReferences, websiteSetup as websiteSetupObjects } from '../../../constants/website-setup';

import BaseController from "../../admin/base-controller";
import CommonService from '../../../services/frontend/guest/common-service';
import PagesService from '../../../services/frontend/guest/pages-service';

const controller = new BaseController();

class PageController extends BaseController {

    async findPagesData(req: Request, res: Response): Promise<void> {
        try {
            const pageSlug = req.params.slug
            if (checkValueExists(blockReferences, pageSlug)) {

                let query: any = { _id: { $exists: true } };
                const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
                if (countryId) {
                    query = {
                        ...query,
                        countryId,
                        block: websiteSetupObjects.pages,
                        blockReference: pageSlug,
                        status: '1',
                    } as any;

                    const websiteSetup = await PagesService.findPagesData({
                        limit: 500,
                        hostName: req.get('origin'),
                        block: websiteSetupObjects.pages,
                        blockReference: pageSlug,
                        query,
                    });

                    return controller.sendSuccessResponse(res, {
                        requestedData: websiteSetup,
                        message: 'Success!'
                    }, 200);
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Error',
                        validation: 'block and blockReference is missing! please check'
                    }, req);
                }

            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'Invalid page'
                }, req);
            }
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching ' });
        }
    }

}


export default new PageController;
import { Request, Response, response } from 'express';
import { CommonQueryParams } from '../../../utils/types/frontend/common';

import BaseController from "../../admin/base-controller";
import CommonService from '../../../services/frontend/common-service';


const controller = new BaseController();

class PageController extends BaseController {

    async findPagesData(req: Request, res: Response): Promise<void> {
        try {
            const pageSlug = req.params.slug 
            console.log('pageSlug',pageSlug);
            
            const { block, blockReference } = req.query as CommonQueryParams;
            let query: any = { _id: { $exists: true } };

            const countryId = await CommonService.findOneCountryShortTitleWithId(req.get('host'));

            if (countryId) {
                if (block && blockReference) {
                    query = {
                        ...query,
                        countryId,
                        block: { $in: block.split(',') },
                        blockReference: { $in: blockReference.split(',') },
                        status: '1',
                    } as any;

                    const websiteSetup = await CommonService.findWebsiteSetups({
                        limit: 500,
                        hostName: req.get('host'),
                        block,
                        blockReference,
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
                    validation: 'block and blockReference is missing! please check'
                }, req);
            }

        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching ' });
        }
    }

}


export default new PageController;
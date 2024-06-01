import { Request, Response } from 'express';

import { page, pageReference } from '../../../constants/pages';

import BaseController from '../../../controllers/admin/base-controller';

const controller = new BaseController();

class PageController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {

            return controller.sendSuccessResponse(res, {
                page: page,
                pageReference: pageReference,
            }, 200);
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching countries' });
        }
    }

}

export default new PageController();
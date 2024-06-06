import BaseController from "../base-controller";

const controller = new BaseController();

class GeneralController extends BaseController {



    async findPage(req: Request, res: Response): Promise<void> {
        try {




            // return controller.sendSuccessResponse(res, {
            //     page: page.page,
            //     pageReference: page.pageReference,
            //     linkType: page.linkType,
            // }, 200);
        } catch (error: any) {
            // return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching banners' });
        }
    }
}

export default GeneralController;
import 'module-alias/register';
import { Request, Response, response } from 'express';
const { ObjectId } = require('mongodb');

import BaseController from '../admin/base-controller';
import { websiteSetup as allWebsiteSetup } from '../../constants/website-setup';

import ProductsService from '../../services/admin/ecommerce/product-service';
import { ProductsProps, ProductsQueryParams } from '../../utils/types/products';
import collectionsProductsService from '../../services/admin/website/collections-products-service';
import { CommonQueryParams } from '../../utils/types/frontend/common';
import CommonService from '../../services/frontend/common-service';

const controller = new BaseController();

class HomeController extends BaseController {

    async findWebsiteSetups(req: Request, res: Response): Promise<void> {
        try {
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

    async findAllSliders(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, page, pageReference } = req.query as CommonQueryParams;
            let query: any = { _id: { $exists: true } };

            const countryId = await CommonService.findOneCountryShortTitleWithId(req.get('host'));

            if (countryId) {
                if (page && pageReference) {
                    query = {
                        ...query,
                        countryId,
                        page: page,
                        pageReference: pageReference,
                        status: '1',
                    } as any;

                    const sliders = await CommonService.findAllSliders({
                        page: parseInt(page_size as string),
                        limit: 500,
                        hostName: req.get('host'),
                        query,
                    });

                    return controller.sendSuccessResponse(res, {
                        requestedData: sliders,
                        message: 'Success!'
                    }, 200);
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Error',
                        validation: 'page and pageReference is missing! please check'
                    }, req);
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'page and pageReference is missing! please check'
                }, req);
            }

        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching sliders' });
        }
    }


    async findAllBanners(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, page, pageReference } = req.query as CommonQueryParams;
            let query: any = { _id: { $exists: true } };

            const countryId = await CommonService.findOneCountryShortTitleWithId(req.get('host'));

            if (countryId) {
                if (page && pageReference) {
                    query = {
                        ...query,
                        countryId,
                        page: page,
                        pageReference: pageReference,
                        status: '1',
                    } as any;

                    const banners = await CommonService.findAllBanners({
                        page: parseInt(page_size as string),
                        limit: 500,
                        hostName: req.get('host'),
                        query,
                    });

                    return controller.sendSuccessResponse(res, {
                        requestedData: banners,
                        message: 'Success!'
                    }, 200);
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Error',
                        validation: 'page and pageReference is missing! please check'
                    }, req);
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'page and pageReference is missing! please check'
                }, req);
            }

        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching banners' });
        }
    }

    async findPriorityProducts(req: Request, res: Response): Promise<void> {
        try {
            let query: any = { _id: { $exists: true }, status: '1' };
            const keysToCheck: (keyof ProductsProps)[] = ['newArrivalPriority', 'corporateGiftsPriority'];
            const filteredQuery = keysToCheck.reduce((result: any, key) => {
                if (key in req.query) {
                    result[key] = req.query[key];
                }
                return result;
            }, {} as Partial<ProductsQueryParams>);
            let filteredPriorityQuery: any = {};
            if (Object.keys(filteredQuery).length > 0) {
                for (const key in filteredQuery) {
                    if (filteredQuery[key] === '> 0') {
                        filteredPriorityQuery[key] = { $gt: '0' }; // Set query for key greater than 0
                    } else if (filteredQuery[key] === '0') {
                        filteredPriorityQuery[key] = '0'; // Set query for key equal to 0
                    } else if (filteredQuery[key] === '< 0' || filteredQuery[key] === null || filteredQuery[key] === undefined) {
                        filteredPriorityQuery[key] = { $lt: '0' }; // Set query for key less than 0
                    }
                }
            }
            query = { ...query, ...filteredPriorityQuery };
            
            // Log the final query to ensure it's constructed correctly
            console.log('Final query:', query);

            const products = await CommonService.findPriorityProducts({
                hostName: req.get('host'),
                query,
            });

            controller.sendSuccessResponse(res, {
                requestedData: products,
                message: 'Success'
            }, 200);
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching products' });
        }
    }

    async findCollectionProducts(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, page, pageReference } = req.query as CommonQueryParams;
            let query: any = { _id: { $exists: true } };

            const countryId = await CommonService.findOneCountryShortTitleWithId(req.get('host'));

            if (countryId) {
                if (page && pageReference) {
                    query = {
                        ...query,
                        countryId,
                        page: page,
                        pageReference: pageReference,
                        status: '1',
                    } as any;

                    const products = await CommonService.findCollectionProducts({
                        hostName: req.get('host'),
                        query,
                    });

                    return controller.sendSuccessResponse(res, {
                        requestedData: products,
                        message: 'Success!'
                    }, 200);
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Error',
                        validation: 'page and pageReference is missing! please check'
                    }, req);
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'page and pageReference is missing! please check'
                }, req);
            }

        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching products' });
        }
    }
}

export default new HomeController();
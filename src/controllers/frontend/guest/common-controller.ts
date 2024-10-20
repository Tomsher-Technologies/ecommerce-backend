import 'module-alias/register';
import { Request, Response } from 'express';

import { ProductsProps, ProductsQueryParams } from '../../../utils/types/products';

import BaseController from '../../admin/base-controller';
import { CommonQueryParams } from '../../../utils/types/frontend/common';
import CommonService from '../../../services/frontend/guest/common-service';
import mongoose from 'mongoose';
import StateModel from '../../../model/admin/setup/state-model';
import CityModel from '../../../model/admin/setup/city-model';
import StoreModel from '../../../model/admin/stores/store-model';

const controller = new BaseController();

class CommonController extends BaseController {

    async findAllCountries(req: Request, res: Response): Promise<void> {
        try {
            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                return controller.sendSuccessResponse(res, {
                    requestedData: await CommonService.findAllCountries(),
                    message: 'Success!'
                }, 200);
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'Country is missing! please check'
                }, req);
            }

        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching ' });
        }
    }
    async findAllStates(req: Request, res: Response): Promise<void> {
        try {
            const { countryId = '', stateId = '', getStores = '0' } = req.query as any;
            let query: any = { _id: { $exists: true }, status: '1' };

            if (countryId) {
                query.countryId = new mongoose.Types.ObjectId(countryId);
            }
            if (stateId) {
                query._id = new mongoose.Types.ObjectId(stateId);
            }

            if (getStores === '1') {
                const storeStateIds = await StoreModel.distinct('stateId');
                query._id = { $in: storeStateIds.map((id: any) => new mongoose.Types.ObjectId(id)) };
            }

            const states = await StateModel.find(query);
            return controller.sendSuccessResponse(res, {
                requestedData: states,
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching states.' });
        }
    }

    async findAllCities(req: Request, res: Response): Promise<void> {
        try {
            const { countryId = '', stateId = '', cityId = '', getStores = '0' } = req.query as any;
            let query: any = { _id: { $exists: true } };
            query.status = '1';
            if (countryId) {
                query.countryId = new mongoose.Types.ObjectId(countryId);
            }
            if (stateId) {
                query.stateId = new mongoose.Types.ObjectId(stateId);
            }
            if (cityId) {
                query._id = new mongoose.Types.ObjectId(cityId);
            }

            if (getStores === '1') {
                const storeCityIds = await StoreModel.distinct("cityId", { cityId: { $exists: true } });
                query._id = { $in: storeCityIds.map((id: any) => new mongoose.Types.ObjectId(id)) };
            }

            const requestedData = await CityModel.find(query);

            return controller.sendSuccessResponse(res, {
                requestedData,
                message: 'Success!',
            }, 200);
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching ' });
        }
    }

    async findAllStores(req: Request, res: Response): Promise<void> {
        try {
            const { stateId = '', cityId = '' } = req.query as any;
            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                let query: any = { _id: { $exists: true } };

                query = {
                    ...query,
                    countryId,
                    status: '1',
                } as any;
                if (stateId) {
                    query.stateId = new mongoose.Types.ObjectId(stateId);
                }
                if (cityId) {
                    query.cityId = new mongoose.Types.ObjectId(cityId);
                }
                return controller.sendSuccessResponse(res, {
                    requestedData: await CommonService.findAllStores({
                        hostName: req.get('origin'),
                        query,
                    }),
                    message: 'Success!'
                }, 200);
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'Country is missing! please check'
                }, req);
            }

        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching stores' });
        }
    }
    async findWebsiteSetups(req: Request, res: Response): Promise<void> {
        try {
            const { block, blockReference } = req.query as CommonQueryParams;
            let query: any = { _id: { $exists: true } };

            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));

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
                        hostName: req.get('origin'),
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

            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));

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
                        hostName: req.get('origin'),
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

            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));

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
                        hostName: req.get('origin'),
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
                hostName: req.get('origin'),
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
            const { page_size = 1, page = '', pageReference = '', getspecification, getattribute, collectionproduct = '' } = req.query as CommonQueryParams;
            let query: any = { _id: { $exists: true } };

            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));

            if (countryId) {
                if ((page === '' && pageReference === '') && (collectionproduct === '')) {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Error',
                        validation: 'Either page and pageReference or collectionproduct must be provided! Please check your input.'
                    }, req);
                }
                query = {
                    ...query,
                    countryId,
                    ...(collectionproduct ? { _id: new mongoose.Types.ObjectId(collectionproduct) } : {
                        page: page,
                        pageReference: pageReference
                    }),
                    status: '1',
                } as any;

                const products = await CommonService.findCollectionProducts({
                    hostName: req.get('origin'),
                    query,
                    getspecification,
                    getattribute
                });

                return controller.sendSuccessResponse(res, {
                    requestedData: products,
                    message: 'Success!'
                }, 200);

            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'Country is missing'
                }, req);
            }

        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching products' });
        }
    }

    async findCollectionCategories(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, page = '', pageReference = '', collectioncategory = '' } = req.query as CommonQueryParams;
            let query: any = { _id: { $exists: true } };

            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));

            if (countryId) {
                if ((page === '' && pageReference === '') && (collectioncategory === '')) {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Error',
                        validation: 'Either page and pageReference or collectioncategory must be provided! Please check your input.'
                    }, req);
                }
                query = {
                    ...query,
                    countryId,
                    ...(collectioncategory ? { _id: new mongoose.Types.ObjectId(collectioncategory) } : {
                        page: page,
                        pageReference: pageReference
                    }),
                    status: '1',
                } as any;

                const categories = await CommonService.findCollectionCategories({
                    hostName: req.get('origin'),
                    query,
                });

                return controller.sendSuccessResponse(res, {
                    requestedData: categories,
                    message: 'Success!'
                }, 200);
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'page and pageReference is missing! please check'
                }, req);
            }
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching categories' });
        }
    }

    async findCollectionBrands(req: Request, res: Response): Promise<void> {
        try {
            const { page = '', pageReference = '', collectionbrand = '' } = req.query as CommonQueryParams;
            let query: any = { _id: { $exists: true } };

            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));

            if (countryId) {
                if ((page === '' && pageReference === '') && (collectionbrand === '')) {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Error',
                        validation: 'Either page and pageReference or collectionbrand must be provided! Please check your input.'
                    }, req);
                }
                query = {
                    ...query,
                    countryId,
                    ...(collectionbrand ? { _id: new mongoose.Types.ObjectId(collectionbrand) } : {
                        page: page,
                        pageReference: pageReference
                    }),
                    status: '1',
                } as any;

                const brands = await CommonService.findCollectionBrands({
                    hostName: req.get('origin'),
                    query,
                });

                return controller.sendSuccessResponse(res, {
                    requestedData: brands,
                    message: 'Success!'
                }, 200);
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'page and pageReference is missing! please check'
                }, req);
            }

        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching brands' });
        }
    }

    async findPaymentMethods(req: Request, res: Response): Promise<void> {
        try {
            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                let query: any = { _id: { $exists: true } };

                const { enableDisplay = ['0', '1', '2'] } = req.query;
                query = {
                    ...query,
                    countryId,
                    status: '1',
                } as any;

                if (enableDisplay && enableDisplay !== '') {
                    query.enableDisplay = { $in: Array.isArray(enableDisplay) ? enableDisplay : [enableDisplay] };
                } else {
                    query.enableDisplay = '1';
                }

                return controller.sendSuccessResponse(res, {
                    requestedData: await CommonService.findPaymentMethods({
                        hostName: req.get('origin'),
                        query,
                    }),
                    message: 'Success!'
                }, 200);
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'Country is missing! please check'
                }, req);
            }

        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching ' });
        }
    }
}

export default new CommonController();
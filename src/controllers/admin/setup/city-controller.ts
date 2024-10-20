import 'module-alias/register';
import { Request, Response } from 'express';
import mongoose, { Schema, Types } from 'mongoose';

import { formatZodError, slugify } from '../../../utils/helpers';
import { citySchema, cityStatusSchema } from '../../../utils/schemas/admin/setup/city-schema';
import { QueryParams } from '../../../utils/types/common';
import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from '../../../constants/admin/task-log';

import BaseController from '../base-controller';
import CityService from '../../../services/admin/setup/city-service'
import { CityProps } from '../../../model/admin/setup/city-model';
import { collections } from '../../../constants/collections';

const controller = new BaseController();

class CityController extends BaseController {

    async findAllCity(req: Request, res: Response): Promise<void> {
        try {
            const { countryId = '', stateId = '', page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '' } = req.query as any;
            let query: any = { _id: { $exists: true } };

            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            } else {
                query.status = '1';
            }

            if (countryId) {
                query.countryId = new mongoose.Types.ObjectId(countryId);
            }

            if (stateId) {
                query.stateId = new mongoose.Types.ObjectId(stateId);
            }

            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = {
                    $or: [
                        { cityTitle: keywordRegex },
                    ],
                    ...query
                } as any;
            }
            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }

            const cities = await CityService.findAllCity({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            return controller.sendSuccessResponse(res, {
                requestedData: cities,
                totalCount: await CityService.getCityTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching cities' });
        }
    }

    async createCity(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = citySchema.safeParse(req.body);
            if (validatedData.success) {
                const { countryId, stateId, cityTitle, slug, } = validatedData.data;
                const user = res.locals.user;
                const cityData: Partial<any> = {
                    countryId,
                    stateId,
                    cityTitle,
                    slug: slug || slugify(cityTitle) as any,
                    status: '1', // active
                    statusAt: new Date(),
                    createdBy: user._id,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                const newCity = await CityService.creatCitye(cityData);
                if (newCity) {
                    return controller.sendSuccessResponse(res, {
                        requestedData: newCity,
                        message: 'City created successfully!'
                    }, 200, { // task log
                        userId: user._id,
                        countryId: user.countryId,
                        sourceCollection: collections.setup.cities,
                        referenceData: JSON.stringify(newCity, null, 2),
                        sourceFromId: newCity._id,
                        sourceFrom: adminTaskLog.setup.city,
                        activity: adminTaskLogActivity.create,
                        activityComment: 'City created successfully!',
                        activityStatus: adminTaskLogStatus.success
                    });
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Something went wrong, please try again!',
                    }, req);
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) {
            if (error && error.errors) {
                let validationError: any = '';
                if (error.errors.cityTitle && error.errors.cityTitle.properties) {
                    validationError = {
                        message: 'Validation error',
                        validation: {
                            cityTitle: error.errors.cityTitle.properties.message
                        }
                    }
                }
                return controller.sendErrorResponse(res, 200, validationError, req);
            } else {
                controller.sendErrorResponse(res, 500, {
                    message: error.message || 'Some error occurred while updating city'
                }, req);
            }
        }
    }


    async findOneCity(req: Request, res: Response): Promise<void> {
        try {
            const cityId = req.params.id;
            if (cityId) {
                const city = await CityService.findOneCity(cityId);
                controller.sendSuccessResponse(res, {
                    requestedData: city,
                    message: 'Success'
                });
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'City Id not found!',
                });
            }
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }

    async findOneCityFromState(req: Request, res: Response): Promise<void> {
        try {
            const stateId = req.params.id;
            if (stateId) {
                const city = await CityService.findOneCity({ stateId: new Schema.Types.ObjectId(stateId) });
                return controller.sendSuccessResponse(res, {
                    requestedData: city,
                    message: 'Success'
                });
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'State Id not found!',
                });
            }
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }

    async updateCity(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = citySchema.safeParse(req.body);
            if (validatedData.success) {
                const cityId = req.params.id;
                if (cityId) {
                    let updatedCityData = req.body;
                    updatedCityData = {
                        ...updatedCityData,
                        updatedAt: new Date()
                    };

                    const updatedCity = await CityService.updateCity(cityId, updatedCityData);
                    if (updatedCity) {
                        const user = res.locals.user;
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedCity,
                            message: 'City updated successfully!'
                        }, 200, { // task log
                            userId: user._id,
                            countryId: user.countryId,
                            sourceCollection: collections.setup.cities,
                            referenceData: JSON.stringify(updatedCity, null, 2),
                            sourceFromId: updatedCity._id,
                            sourceFrom: adminTaskLog.setup.city,
                            activity: adminTaskLogActivity.update,
                            activityComment: 'City updated successfully!',
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'City Id not found!',
                        }, req);
                    }
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'City Id not found! Please try again with city id',
                    }, req);
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) {
            if (error && error.errors) {
                let validationError: any = '';
                if (error.errors.cityTitle && error.errors.cityTitle.properties) {
                    validationError = {
                        message: 'Validation error',
                        validation: {
                            cityTitle: error.errors.cityTitle.properties.message
                        }
                    }
                }
                return controller.sendErrorResponse(res, 200, validationError, req);
            } else {
                return controller.sendErrorResponse(res, 500, {
                    message: error.message || 'Some error occurred while updating city'
                }, req);
            }
        }
    }

    async statusChangeCity(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = cityStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const cityId = req.params.id;
                if (cityId) {
                    let { status } = req.body;
                    const updatedCityData = { status };

                    const updatedCity = await CityService.updateCity(cityId, updatedCityData);
                    if (updatedCity) {
                        const user = res.locals.user;
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedCity,
                            message: 'City status updated successfully!'
                        }, 200, { // task log
                            userId: user._id,
                            countryId: user.countryId,
                            sourceCollection: collections.setup.cities,
                            referenceData: JSON.stringify(updatedCity, null, 2),
                            sourceFromId: updatedCity._id,
                            sourceFrom: adminTaskLog.setup.city,
                            activity: adminTaskLogActivity.statusChange,
                            activityComment: 'City status updated successfully!',
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'City Id not found!',
                        }, req);
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'City Id not found! Please try again with city id',
                    }, req);
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating brand'
            }, req);
        }
    }

    async destroy(req: Request, res: Response): Promise<void> {
        try {
            const cityId = req.params.id;
            if (cityId) {
                const city = await CityService.findOneCity(cityId);
                if (city) {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'You cant delete this city!',
                    });
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'This City details not found!',
                    });
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'City id not found!',
                });
            }
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting city' });
        }
    }

}

export default new CityController();
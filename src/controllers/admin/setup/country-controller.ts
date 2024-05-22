import 'module-alias/register';
import { Request, Response } from 'express';

import { formatZodError, handleFileUpload, slugify } from '../../../utils/helpers';
import { countrySchema, countryStatusSchema } from '../../../utils/schemas/admin/setup/country-schema';
import { QueryParams } from '../../../utils/types/common';
import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from '../../../constants/admin/task-log';

import BaseController from '../../../controllers/admin/base-controller';
import CountryService from '../../../services/admin/setup/country-service'
import { CountryProps } from '../../../model/admin/setup/country-model';

const controller = new BaseController();

class CountryController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, status = ['1', '2'], sortby = '', sortorder = '', keyword = '' } = req.query as QueryParams;
            let query: any = { _id: { $exists: true } };

            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            } else {
                query.status = '1';
            }

            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = {
                    $or: [
                        { countryTitle: keywordRegex },
                        { countryCode: keywordRegex },
                        { currencyCode: keywordRegex },
                    ],
                    ...query
                } as any;
            }
            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }

            const countries = await CountryService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            controller.sendSuccessResponse(res, {
                requestedData: countries,
                totalCount: await CountryService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching countries' });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = countrySchema.safeParse(req.body);
            // console.log('req', req.file);

            if (validatedData.success) {
                const { countryTitle, slug, countryCode, currencyCode, isOrigin } = validatedData.data;
                const user = res.locals.user;

                const countryData: Partial<CountryProps> = {
                    countryTitle,
                    slug: slug || slugify(countryTitle) as any,
                    countryImageUrl: handleFileUpload(req, null, req.file, 'countryImageUrl', 'country'),
                    countryCode,
                    currencyCode,
                    isOrigin,
                    status: '1', // active
                    statusAt: new Date(),
                    createdBy: user._id,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };


                const newCountry = await CountryService.create(countryData);
                return controller.sendSuccessResponse(res, {
                    requestedData: newCountry,
                    message: 'Country created successfully!'
                }, 200, { // task log
                    sourceFromId: newCountry._id,
                    sourceFrom: adminTaskLog.setup.country,
                    activity: adminTaskLogActivity.create,
                    activityStatus: adminTaskLogStatus.success
                });
            } else {

                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) {
            if (error && error.errors && (error.errors?.countryTitle) && (error.errors?.countryTitle?.properties)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        countryTitle: error.errors?.countryTitle?.properties.message
                    }
                }, req);
            }
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating country',
            }, req);
        }
    }


    async findOne(req: Request, res: Response): Promise<void> {
        try {
            const countryId = req.params.id;
            if (countryId) {
                const country = await CountryService.findOne(countryId);
                controller.sendSuccessResponse(res, {
                    requestedData: country,
                    message: 'Success'
                });
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Country Id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = countrySchema.safeParse(req.body);
            if (validatedData.success) {
                const countryId = req.params.id;
                if (countryId) {
                    let updatedCountryData = req.body;
                    updatedCountryData = {
                        ...updatedCountryData,
                        countryImageUrl: handleFileUpload(req, await CountryService.findOne(countryId), req.file, 'countryImageUrl', 'country'),
                        updatedAt: new Date()
                    };

                    const updatedCountry = await CountryService.update(countryId, updatedCountryData);
                    if (updatedCountry) {
                        controller.sendSuccessResponse(res, {
                            requestedData: updatedCountry,
                            message: 'Country updated successfully!'
                        }, 200, { // task log
                            sourceFromId: updatedCountry._id,
                            sourceFrom: adminTaskLog.setup.country,
                            activity: adminTaskLogActivity.update,
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        controller.sendErrorResponse(res, 200, {
                            message: 'Country Id not found!',
                        }, req);
                    }
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Country Id not found! Please try again with country id',
                    }, req);
                }
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating country'
            }, req);
        }
    }

    async statusChange(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = countryStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const countryId = req.params.id;
                if (countryId) {
                    let { status } = req.body;
                    const updatedCountryData = { status };

                    const updatedCountry = await CountryService.update(countryId, updatedCountryData);
                    if (updatedCountry) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedCountry,
                            message: 'Country status updated successfully!'
                        }, 200, { // task log
                            sourceFromId: updatedCountry._id,
                            sourceFrom: adminTaskLog.setup.country,
                            activity: adminTaskLogActivity.statusChange,
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Country Id not found!',
                        }, req);
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Country Id not found! Please try again with country id',
                    }, req);
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating brand'
            }, req);
        }
    }

    async destroy(req: Request, res: Response): Promise<void> {
        try {
            const countryId = req.params.id;
            if (countryId) {
                const country = await CountryService.findOne(countryId);
                if (country) {
                    // await CountryService.destroy(countryId);
                    // controller.sendSuccessResponse(res, { message: 'Country deleted successfully!' });

                    controller.sendErrorResponse(res, 200, {
                        message: 'You cant delete this country!',
                    });
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'This Country details not found!',
                    });
                }
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Country id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting country' });
        }
    }

}

export default new CountryController();
import 'module-alias/register';
import { Request, Response } from 'express';

import { formatZodError, handleFileUpload, slugify } from '../../../utils/helpers';
import { QueryParams } from '../../../utils/types/common';
import { specificationSchema, specificationStatusSchema } from '../../../utils/schemas/admin/ecommerce/specification-schema';

import { SpecificationProps } from '../../../model/admin/ecommerce/specifications-model';
import BaseController from '../../../controllers/admin/base-controller';
import SpecificationService from '../../../services/admin/ecommerce/specification-service'
import GeneralService from '../../../services/admin/general-service';
import { multiLanguageSources } from '../../../constants/multi-languages';
import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from '../../../constants/admin/task-log';
import mongoose from 'mongoose';

const controller = new BaseController();

class SpecificationController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, sortby = '', sortorder = '', keyword = '', _id = '' } = req.query as QueryParams;
            let query = { _id: { $exists: true } };

            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = {
                    $or: [
                        { specificationTitle: keywordRegex }
                    ],
                    ...query
                } as any;
            }

            if (_id) {
                query = {
                    ...query, _id: new mongoose.Types.ObjectId(_id)
                } as any;
            }

            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }

            const specifications = await SpecificationService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            controller.sendSuccessResponse(res, {
                requestedData: specifications,
                totalCount: await SpecificationService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching specifications' });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = specificationSchema.safeParse(req.body);
            // console.log('req', req.file);

            if (validatedData.success) {
                const { specificationTitle, specificationValues, languageValues } = validatedData.data;

                const specificationData: Partial<SpecificationProps> = {
                    specificationTitle,
                    status: '1',
                    slug: slugify(specificationTitle),
                    createdAt: new Date(),
                };

                const newSpecification = await SpecificationService.create(specificationData);
                if (newSpecification) {
                    let specificationDetailsValues: any = []
                    specificationDetailsValues = await SpecificationService.specificationDetailsService(newSpecification._id, specificationValues);

                    if (specificationDetailsValues && languageValues && languageValues.length > 0) {

                        await languageValues?.map(async (languageValue: any, index: number) => {
                            const setSpecificationDetailsValues = languageValue.languageValues.specificationValues.map((specificationLanguageValue: any, specificationIndex: number) => {
                                return {
                                    ...specificationLanguageValue,
                                    specificationDetailId: specificationDetailsValues[specificationIndex]._id,
                                    specificationId: specificationDetailsValues[specificationIndex].specificationId,
                                }

                            })
                            if (setSpecificationDetailsValues && setSpecificationDetailsValues.length > 0) {
                                GeneralService.multiLanguageFieledsManage(newSpecification._id, {
                                    ...languageValue,
                                    source: multiLanguageSources.ecommerce.specifications,
                                    languageValues: {
                                        specificationTitle: languageValue.languageValues.specificationTitle,
                                        specificationValues: setSpecificationDetailsValues,
                                    }
                                })
                            }
                        })
                    }
                    return controller.sendSuccessResponse(res, {
                        requestedData: {
                            _id: newSpecification._id,
                            specificationTitle: newSpecification.specificationTitle,
                            specificationValues: specificationDetailsValues
                        },
                        message: 'Specification created successfully!'
                    }, 200, {
                        sourceFromId: newSpecification._id,
                        sourceFrom: adminTaskLog.ecommerce.specifications,
                        activity: adminTaskLogActivity.update,
                        activityStatus: adminTaskLogStatus.success
                    });
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                    }, req);
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) {

            if (error && error.errors && (error.errors?.$specificationTitle) && (error.errors?.specificationTitle?.properties)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        specificationTitle: error.errors?.specificationTitle?.properties.message
                    }
                }, req);
            }
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating specification',
            }, req);
        }
    }


    async findOne(req: Request, res: Response): Promise<void> {
        try {
            const specificationId = req.params.id;
            if (specificationId) {
                const specification = await SpecificationService.findOne(specificationId);
                controller.sendSuccessResponse(res, {
                    requestedData: specification,
                    message: 'Success'
                });
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Specification Id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = specificationSchema.safeParse(req.body);
            if (validatedData.success) {
                const specificationId = req.params.id;
                if (specificationId) {
                    let updatedSpecificationData = req.body;
                    updatedSpecificationData = {
                        ...updatedSpecificationData,
                        updatedAt: new Date()
                    };

                    const updatedSpecification = await SpecificationService.update(specificationId, updatedSpecificationData);
                    if (updatedSpecification) {
                        if (updatedSpecification) {

                            const newValue = await SpecificationService.specificationDetailsService(updatedSpecification._id, validatedData.data.specificationValues);
                            let newLanguageValues: any = []

                            if (updatedSpecificationData.languageValues && updatedSpecificationData.languageValues.length > 0) {
                                for (let i = 0; i < updatedSpecificationData.languageValues.length; i++) {
                                    const languageValue = updatedSpecificationData.languageValues[i];

                                    const languageValues = await GeneralService.multiLanguageFieledsManage(updatedSpecification._id, {
                                        ...languageValue,
                                        languageValues: {
                                            ...languageValue.languageValues,
                                        }
                                    });
                                    newLanguageValues.push(languageValues);
                                }

                            }
                            return controller.sendSuccessResponse(res, {
                                requestedData: {
                                    _id: updatedSpecification._id,
                                    specificationTitle: updatedSpecification.specificationTitle,
                                    specificationValue: newValue
                                },
                                message: 'Specification updated successfully!'
                            }, 200, {
                                sourceFromId: updatedSpecification._id,
                                sourceFrom: adminTaskLog.ecommerce.specifications,
                                activity: adminTaskLogActivity.update,
                                activityStatus: adminTaskLogStatus.success
                            });
                        } else {
                            return controller.sendErrorResponse(res, 200, {
                                message: 'Validation error',
                            }, req);
                        }

                    } else {
                        controller.sendErrorResponse(res, 200, {
                            message: 'Specification Id not found!',
                        }, req);
                    }
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Specification Id not found! Please try again with specification id',
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
                message: error.message || 'Some error occurred while updating specification'
            }, req);
        }
    }

    async statusChange(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = specificationStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const specificationId = req.params.id;
                if (specificationId) {
                    let { status } = req.body;
                    const updatedSpecificationData = { status };

                    const updatedSpecification = await SpecificationService.update(specificationId, updatedSpecificationData);
                    if (updatedSpecification) {
                        controller.sendSuccessResponse(res, {
                            requestedData: updatedSpecification,
                            message: 'Specification status updated successfully!'
                        }, 200, {
                            sourceFromId: updatedSpecification._id,
                            sourceFrom: adminTaskLog.ecommerce.specifications,
                            activity: adminTaskLogActivity.statusChange,
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        controller.sendErrorResponse(res, 200, {
                            message: 'Specification Id not found!',
                        }, req);
                    }
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Specification Id not found! Please try again with specification id',
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
                message: error.message || 'Some error occurred while updating specification'
            }, req);
        }
    }

    async destroy(req: Request, res: Response): Promise<void> {
        try {
            const specificationId = req.params.id;
            if (specificationId) {
                const specification = await SpecificationService.findOne(specificationId);
                if (specification) {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Cant to be delete specification!!',
                    });
                    // await SpecificationService.destroy(specificationId);
                    // controller.sendSuccessResponse(res, { message: 'Specification deleted successfully!' });
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'This specification details not found!',
                    });
                }
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Specification id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting specification' });
        }
    }

}

export default new SpecificationController();
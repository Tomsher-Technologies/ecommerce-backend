import 'module-alias/register';
import mongoose from 'mongoose';
import { Request, Response } from 'express';

import { formatZodError, slugify } from '../../../utils/helpers';
import { stateSchema, stateStatusSchema } from '../../../utils/schemas/admin/setup/state-schema';
import { QueryParams } from '../../../utils/types/common';
import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from '../../../constants/admin/task-log';

import BaseController from '../../../controllers/admin/base-controller';
import StateService from '../../../services/admin/setup/state-service'

const controller = new BaseController();

class StateController extends BaseController {

    async findAllState(req: Request, res: Response): Promise<void> {
        try {
            const { countryId = '', page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '' } = req.query as QueryParams;
            let query: any = { _id: { $exists: true } };

            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            } else {
                query.status = '1';
            }

            if (countryId) {
                query.countryId = new mongoose.Types.ObjectId(countryId);
            }

            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = {
                    $or: [
                        { stateTitle: keywordRegex },
                    ],
                    ...query
                } as any;
            }
            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }

            const states = await StateService.findAllState({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            controller.sendSuccessResponse(res, {
                requestedData: states,
                totalCount: await StateService.getStateTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching states' });
        }
    }

    async createState(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = stateSchema.safeParse(req.body);
            if (validatedData.success) {
                const { countryId, stateTitle, slug, } = validatedData.data;
                const user = res.locals.user;
                const stateData: Partial<any> = {
                    countryId,
                    stateTitle,
                    slug: slug || slugify(stateTitle) as any,
                    status: '1', // active
                    statusAt: new Date(),
                    createdBy: user._id,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                const newState = await StateService.creatState(stateData);
                if (newState) {
                    return controller.sendSuccessResponse(res, {
                        requestedData: newState,
                        message: 'State created successfully!'
                    }, 200, { // task log
                        sourceFromId: newState._id,
                        sourceFrom: adminTaskLog.setup.state,
                        activity: adminTaskLogActivity.create,
                        activityStatus: adminTaskLogStatus.success
                    });
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Something went wrong',
                    }, req);
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) {
            console.log('error', error);

            if (error && error.errors) {
                let validationError: any = '';
                if (error.errors.stateTitle && error.errors.stateTitle.properties) {
                    validationError = {
                        message: 'Validation error',
                        validation: {
                            stateTitle: error.errors.stateTitle.properties.message
                        }
                    }
                }
                return controller.sendErrorResponse(res, 200, validationError, req);
            } else {
                controller.sendErrorResponse(res, 500, {
                    message: error.message || 'Some error occurred while updating state'
                }, req);
            }
        }
    }


    async findOneState(req: Request, res: Response): Promise<void> {
        try {
            const stateId = req.params.id;
            if (stateId) {
                const state = await StateService.findOneState(stateId);
                controller.sendSuccessResponse(res, {
                    requestedData: state,
                    message: 'Success'
                });
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'State Id not found!',
                });
            }
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }

    async updateState(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = stateSchema.safeParse(req.body);
            if (validatedData.success) {
                const stateId = req.params.id;
                if (stateId) {
                    let updatedStateData = req.body;
                    updatedStateData = {
                        ...updatedStateData,
                        updatedAt: new Date()
                    };

                    const updatedState = await StateService.updateState(stateId, updatedStateData);
                    if (updatedState) {
                        controller.sendSuccessResponse(res, {
                            requestedData: updatedState,
                            message: 'State updated successfully!'
                        }, 200, { // task log
                            sourceFromId: updatedState._id,
                            sourceFrom: adminTaskLog.setup.state,
                            activity: adminTaskLogActivity.update,
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        controller.sendErrorResponse(res, 200, {
                            message: 'State Id not found!',
                        }, req);
                    }
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'State Id not found! Please try again with state id',
                    }, req);
                }
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) {
            if (error && error.errors) {
                let validationError: any = '';
                if (error.errors.stateTitle && error.errors.stateTitle.properties) {
                    validationError = {
                        message: 'Validation error',
                        validation: {
                            stateTitle: error.errors.stateTitle.properties.message
                        }
                    }
                }
                return controller.sendErrorResponse(res, 200, validationError, req);
            } else {
                controller.sendErrorResponse(res, 500, {
                    message: error.message || 'Some error occurred while updating state'
                }, req);
            }
        }
    }

    async statusChangeState(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = stateStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const stateId = req.params.id;
                if (stateId) {
                    let { status } = req.body;
                    const updatedStateData = { status };

                    const updatedState = await StateService.updateState(stateId, updatedStateData);
                    if (updatedState) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedState,
                            message: 'State status updated successfully!'
                        }, 200, { // task log
                            sourceFromId: updatedState._id,
                            sourceFrom: adminTaskLog.setup.state,
                            activity: adminTaskLogActivity.statusChange,
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'State Id not found!',
                        }, req);
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'State Id not found! Please try again with state id',
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

    async destroyState(req: Request, res: Response): Promise<void> {
        try {
            const stateId = req.params.id;
            if (stateId) {
                const state = await StateService.findOneState(stateId);
                if (state) {
                    controller.sendErrorResponse(res, 200, {
                        message: 'You cant delete this state!',
                    });
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'This State details not found!',
                    });
                }
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'State id not found!',
                });
            }
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting state' });
        }
    }

}

export default new StateController();
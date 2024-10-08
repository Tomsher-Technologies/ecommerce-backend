"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const mongoose_1 = __importDefault(require("mongoose"));
const helpers_1 = require("../../../utils/helpers");
const state_schema_1 = require("../../../utils/schemas/admin/setup/state-schema");
const task_log_1 = require("../../../constants/admin/task-log");
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const state_service_1 = __importDefault(require("../../../services/admin/setup/state-service"));
const collections_1 = require("../../../constants/collections");
const controller = new base_controller_1.default();
class StateController extends base_controller_1.default {
    async findAllState(req, res) {
        try {
            const { countryId = '', page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '' } = req.query;
            let query = { _id: { $exists: true } };
            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            }
            else {
                query.status = '1';
            }
            if (countryId) {
                query.countryId = new mongoose_1.default.Types.ObjectId(countryId);
            }
            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = {
                    $or: [
                        { stateTitle: keywordRegex },
                    ],
                    ...query
                };
            }
            const sort = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const states = await state_service_1.default.findAllState({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort
            });
            controller.sendSuccessResponse(res, {
                requestedData: states,
                totalCount: await state_service_1.default.getStateTotalCount(query),
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching states' });
        }
    }
    async createState(req, res) {
        try {
            const validatedData = state_schema_1.stateSchema.safeParse(req.body);
            if (validatedData.success) {
                const { countryId, stateTitle, slug, } = validatedData.data;
                const user = res.locals.user;
                const stateData = {
                    countryId,
                    stateTitle,
                    slug: slug || (0, helpers_1.slugify)(stateTitle),
                    status: '1', // active
                    statusAt: new Date(),
                    createdBy: user._id,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                const newState = await state_service_1.default.creatState(stateData);
                if (newState) {
                    return controller.sendSuccessResponse(res, {
                        requestedData: newState,
                        message: 'State created successfully!'
                    }, 200, {
                        userId: user._id,
                        countryId: user.countryId,
                        sourceCollection: collections_1.collections.setup.states,
                        referenceData: JSON.stringify(newState, null, 2),
                        sourceFromId: newState._id,
                        sourceFrom: task_log_1.adminTaskLog.setup.state,
                        activity: task_log_1.adminTaskLogActivity.create,
                        activityComment: 'State created successfully!',
                        activityStatus: task_log_1.adminTaskLogStatus.success
                    });
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Something went wrong',
                    }, req);
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                }, req);
            }
        }
        catch (error) {
            console.log('error', error);
            if (error && error.errors) {
                let validationError = '';
                if (error.errors.stateTitle && error.errors.stateTitle.properties) {
                    validationError = {
                        message: 'Validation error',
                        validation: {
                            stateTitle: error.errors.stateTitle.properties.message
                        }
                    };
                }
                return controller.sendErrorResponse(res, 200, validationError, req);
            }
            else {
                controller.sendErrorResponse(res, 500, {
                    message: error.message || 'Some error occurred while updating state'
                }, req);
            }
        }
    }
    async findOneState(req, res) {
        try {
            const stateId = req.params.id;
            if (stateId) {
                const state = await state_service_1.default.findOneState(stateId);
                controller.sendSuccessResponse(res, {
                    requestedData: state,
                    message: 'Success'
                });
            }
            else {
                controller.sendErrorResponse(res, 200, {
                    message: 'State Id not found!',
                });
            }
        }
        catch (error) {
            controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
    async updateState(req, res) {
        try {
            const validatedData = state_schema_1.stateSchema.safeParse(req.body);
            if (validatedData.success) {
                const stateId = req.params.id;
                if (stateId) {
                    const user = res.locals.user;
                    let updatedStateData = req.body;
                    updatedStateData = {
                        ...updatedStateData,
                        updatedAt: new Date()
                    };
                    const updatedState = await state_service_1.default.updateState(stateId, updatedStateData);
                    if (updatedState) {
                        controller.sendSuccessResponse(res, {
                            requestedData: updatedState,
                            message: 'State updated successfully!'
                        }, 200, {
                            userId: user._id,
                            countryId: user.countryId,
                            sourceCollection: collections_1.collections.setup.states,
                            referenceData: JSON.stringify(updatedState, null, 2),
                            sourceFromId: updatedState._id,
                            sourceFrom: task_log_1.adminTaskLog.setup.state,
                            activity: task_log_1.adminTaskLogActivity.update,
                            activityComment: 'State updated successfully!',
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        controller.sendErrorResponse(res, 200, {
                            message: 'State Id not found!',
                        }, req);
                    }
                }
                else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'State Id not found! Please try again with state id',
                    }, req);
                }
            }
            else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                }, req);
            }
        }
        catch (error) {
            if (error && error.errors) {
                let validationError = '';
                if (error.errors.stateTitle && error.errors.stateTitle.properties) {
                    validationError = {
                        message: 'Validation error',
                        validation: {
                            stateTitle: error.errors.stateTitle.properties.message
                        }
                    };
                }
                return controller.sendErrorResponse(res, 200, validationError, req);
            }
            else {
                controller.sendErrorResponse(res, 500, {
                    message: error.message || 'Some error occurred while updating state'
                }, req);
            }
        }
    }
    async statusChangeState(req, res) {
        try {
            const validatedData = state_schema_1.stateStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const stateId = req.params.id;
                if (stateId) {
                    let { status } = req.body;
                    const updatedStateData = { status };
                    const user = res.locals.user;
                    const updatedState = await state_service_1.default.updateState(stateId, updatedStateData);
                    if (updatedState) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedState,
                            message: 'State status updated successfully!'
                        }, 200, {
                            userId: user._id,
                            countryId: user.countryId,
                            sourceCollection: collections_1.collections.setup.states,
                            referenceData: JSON.stringify(updatedState, null, 2),
                            sourceFromId: updatedState._id,
                            sourceFrom: task_log_1.adminTaskLog.setup.state,
                            activity: task_log_1.adminTaskLogActivity.statusChange,
                            activityComment: 'State status updated successfully!',
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'State Id not found!',
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'State Id not found! Please try again with state id',
                    }, req);
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                }, req);
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating brand'
            }, req);
        }
    }
    async destroyState(req, res) {
        try {
            const stateId = req.params.id;
            if (stateId) {
                const state = await state_service_1.default.findOneState(stateId);
                if (state) {
                    controller.sendErrorResponse(res, 200, {
                        message: 'You cant delete this state!',
                    });
                }
                else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'This State details not found!',
                    });
                }
            }
            else {
                controller.sendErrorResponse(res, 200, {
                    message: 'State id not found!',
                });
            }
        }
        catch (error) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting state' });
        }
    }
}
exports.default = new StateController();

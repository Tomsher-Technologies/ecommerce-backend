"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const helpers_1 = require("../../../../src/utils/helpers");
const user_type_schema_1 = require("../../../../src/utils/schemas/admin/account/user-type-schema");
const task_log_1 = require("../../../../src/constants/admin/task-log");
const base_controller_1 = __importDefault(require("../../../../src/controllers/admin/base-controller"));
const user_type_service_1 = __importDefault(require("../../../../src/services/admin/account/user-type-service"));
const collections_1 = require("../../../constants/collections");
const controller = new base_controller_1.default();
class UserTypeController extends base_controller_1.default {
    async findAll(req, res) {
        const { page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '' } = req.query;
        let query = { _id: { $exists: true } };
        if (status && status !== '') {
            query.status = { $in: Array.isArray(status) ? status : [status] };
        }
        else {
            query.status = '1';
        }
        if (keyword) {
            const keywordRegex = new RegExp(keyword, 'i');
            query = {
                $or: [
                    { userTypeName: keywordRegex }
                ],
                ...query
            };
        }
        const sort = {};
        if (sortby && sortorder) {
            sort[sortby] = sortorder === 'desc' ? -1 : 1;
        }
        try {
            const usersTypes = await user_type_service_1.default.findAll({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort
            });
            return controller.sendSuccessResponse(res, {
                requestedData: usersTypes,
                totalCount: await user_type_service_1.default.getTotalCount(query),
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching user types' });
        }
    }
    async create(req, res) {
        try {
            const validatedData = user_type_schema_1.usertypeSchema.safeParse(req.body);
            if (validatedData.success) {
                const { userTypeName, slug } = validatedData.data;
                const user = res.locals.user;
                const userTypeData = {
                    userTypeName,
                    slug: slug || (0, helpers_1.slugify)(userTypeName),
                    status: '1',
                    createdBy: user._id,
                    createdAt: new Date()
                };
                const newUserType = await user_type_service_1.default.create(userTypeData);
                return controller.sendSuccessResponse(res, {
                    requestedData: newUserType,
                    message: 'User type created successfully!'
                }, 200, {
                    userId: user._id,
                    countryId: user.countryId,
                    sourceCollection: collections_1.collections.account.userTypes,
                    referenceData: JSON.stringify(newUserType, null, 2),
                    sourceFromId: newUserType._id,
                    sourceFrom: task_log_1.adminTaskLog.account.userTypes,
                    activity: task_log_1.adminTaskLogActivity.create,
                    activityComment: 'User type created successfully!',
                    activityStatus: task_log_1.adminTaskLogStatus.success
                });
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                });
            }
        }
        catch (error) {
            if (error && error.errors && error.errors.userTypeName && error.errors.userTypeName.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        userTypeName: error.errors.userTypeName.properties.message
                    }
                });
            }
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating user type',
            });
        }
    }
    async findOne(req, res) {
        try {
            const userTypeId = req.params.id;
            if (userTypeId) {
                const userType = await user_type_service_1.default.findOne(userTypeId);
                return controller.sendSuccessResponse(res, {
                    requestedData: userType,
                    message: 'Success'
                });
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'User type Id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
    async update(req, res) {
        try {
            const validatedData = user_type_schema_1.usertypeSchema.safeParse(req.body);
            if (validatedData.success) {
                const userTypeId = req.params.id;
                const user = res.locals.user;
                if (userTypeId) {
                    const updatedUserTypeData = req.body;
                    const updatedUserType = await user_type_service_1.default.update(userTypeId, { ...updatedUserTypeData, updatedAt: new Date() });
                    if (updatedUserType) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedUserType,
                            message: 'User type updated successfully!'
                        }, 200, {
                            userId: user._id,
                            countryId: user.countryId,
                            sourceCollection: collections_1.collections.account.userTypes,
                            referenceData: JSON.stringify(updatedUserType, null, 2),
                            sourceFromId: updatedUserType._id,
                            sourceFrom: task_log_1.adminTaskLog.account.userTypes,
                            activity: task_log_1.adminTaskLogActivity.update,
                            activityComment: 'User type updated successfully!',
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'User type Id not found!',
                        });
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'User type Id not found! Please try again with User type id',
                    });
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating user type'
            });
        }
    }
    async destroy(req, res) {
        try {
            const userTypeId = req.params.id;
            if (userTypeId) {
                const userType = await user_type_service_1.default.findOne(userTypeId);
                if (userType) {
                    // await UserTypeService.destroy(userTypeId);
                    // return controller.sendSuccessResponse(res, { message: 'User type deleted successfully!' });
                    return controller.sendErrorResponse(res, 200, {
                        message: 'You cant delete this user type',
                    });
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'This user type details not found!',
                    });
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'User type id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting user type' });
        }
    }
}
exports.default = new UserTypeController();

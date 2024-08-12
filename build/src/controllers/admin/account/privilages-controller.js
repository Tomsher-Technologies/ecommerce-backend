"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const helpers_1 = require("../../../../src/utils/helpers");
const base_controller_1 = __importDefault(require("../../../../src/controllers/admin/base-controller"));
const privilages_service_1 = __importDefault(require("../../../../src/services/admin/account/privilages-service"));
const privilage_shema_1 = require("../../../../src/utils/schemas/admin/account/privilage-shema");
const task_log_1 = require("../../../../src/constants/admin/task-log");
const controller = new base_controller_1.default();
class PrivilagesController extends base_controller_1.default {
    async findAll(req, res) {
        try {
            let query = { _id: { $exists: true } };
            const privilages = await privilages_service_1.default.findAll({
                query,
            });
            return controller.sendSuccessResponse(res, {
                requestedData: privilages,
                totalCount: await privilages_service_1.default.getTotalCount(query),
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching users' });
        }
    }
    async managePrivilage(req, res) {
        try {
            const userTypeId = req.params.id;
            if (userTypeId) {
                const validatedData = privilage_shema_1.privilageSchema.safeParse(req.body);
                if (validatedData.success) {
                    const { menuItems, status } = validatedData.data;
                    const privilages = await privilages_service_1.default.findOne(userTypeId);
                    const user = res.locals.user;
                    let privilageData = {};
                    if (privilages) { // update new privilage based on user type
                        const updatedData = {
                            userTypeId,
                            menuItems,
                            updatedBy: user._id,
                            updatedAt: new Date()
                        };
                        const newPrivilageData = await privilages_service_1.default.update(privilages._id, updatedData);
                        privilageData = {
                            requestedData: newPrivilageData,
                            message: 'Privilage updated successfully!'
                        };
                    }
                    else { // insert new privilage based on user type
                        const insertData = {
                            userTypeId,
                            menuItems,
                            status: status || '1',
                            createdBy: user._id,
                            createdAt: new Date()
                        };
                        const updatedPrivilageData = await privilages_service_1.default.create(insertData);
                        privilageData = {
                            requestedData: updatedPrivilageData,
                            message: 'Privilage created successfully!'
                        };
                    }
                    return controller.sendSuccessResponse(res, privilageData, 200, {
                        sourceFromId: privilageData?.requestedData?._id || null,
                        sourceFrom: task_log_1.adminTaskLog.account.privilages,
                        activity: task_log_1.adminTaskLogActivity.managePrivilages,
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
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Privilage Id not found!',
                });
            }
        }
        catch (error) {
            if (error && error.errors && error.errors.userTypeId && error.errors.userTypeId.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        userTypeId: error.errors.userTypeId.properties.message
                    }
                });
            }
            else if (error && error.errors && error.errors.menuItems && error.errors.menuItems.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        menuItems: error.errors.menuItems.properties.message
                    }
                });
            }
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating user'
            });
        }
    }
    async findOne(req, res) {
        try {
            const userTypeId = req.params.id;
            if (userTypeId) {
                const privilages = await privilages_service_1.default.findOne(userTypeId);
                if (privilages) {
                    return controller.sendSuccessResponse(res, {
                        requestedData: privilages,
                        message: 'Success'
                    });
                }
                else {
                    return controller.sendSuccessResponse(res, {
                        requestedData: {},
                        message: 'Privilages not found!',
                    });
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Privilage Id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
}
exports.default = new PrivilagesController();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const bcrypt_1 = __importDefault(require("bcrypt"));
const mongoose_1 = __importDefault(require("mongoose"));
const user_schema_1 = require("../../../../src/utils/schemas/admin/account/user-schema");
const helpers_1 = require("../../../../src/utils/helpers");
const task_log_1 = require("../../../../src/constants/admin/task-log");
const user_service_1 = __importDefault(require("../../../services/admin/account/user-service"));
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const controller = new base_controller_1.default();
// $2b$10$bRcggpnGJHBCLOc.TG/PG.1vVkFEqDME53bHg5z/OvTepBp3J.FzG
class UserController extends base_controller_1.default {
    async findAll(req, res) {
        try {
            const { countryId = '', page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '', userTypeID = '' } = req.query;
            let query = { _id: { $exists: true } };
            const userData = await res.locals.user;
            const country = (0, helpers_1.getCountryId)(userData);
            if (country) {
                query.countryId = country;
            }
            else if (countryId) {
                query.countryId = new mongoose_1.default.Types.ObjectId(countryId);
            }
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
                        { firstName: keywordRegex },
                        { lastName: keywordRegex },
                        { email: keywordRegex },
                        { phone: keywordRegex }
                    ],
                    ...query
                };
            }
            if (userTypeID) {
                query = {
                    ...query, _id: new mongoose_1.default.Types.ObjectId(userTypeID)
                };
            }
            const sort = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const users = await user_service_1.default.findAll({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort
            });
            return controller.sendSuccessResponse(res, {
                requestedData: users,
                totalCount: await user_service_1.default.getTotalCount(query),
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching users' });
        }
    }
    async create(req, res) {
        try {
            const validatedData = user_schema_1.userSchema.safeParse(req.body);
            if (validatedData.success) {
                const { userTypeID, countryId, email, firstName, lastName, phone, password } = validatedData.data;
                const user = res.locals.user;
                const userData = {
                    userTypeID,
                    countryId: countryId || (0, helpers_1.getCountryId)(user),
                    email,
                    firstName,
                    lastName,
                    userImageUrl: (0, helpers_1.handleFileUpload)(req, null, req.file, 'userImageUrl', 'user'),
                    phone,
                    password: await bcrypt_1.default.hash(password, 10),
                    status: '1',
                    createdBy: user._id,
                    createdAt: new Date()
                };
                const newUser = await user_service_1.default.create(userData);
                return controller.sendSuccessResponse(res, {
                    requestedData: newUser,
                    message: 'User created successfully!'
                }, 200, {
                    sourceFromId: newUser._id,
                    sourceFrom: task_log_1.adminTaskLog.account.users,
                    activity: task_log_1.adminTaskLogActivity.create,
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
            if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        email: "Email already exists"
                    }
                });
            }
            else if (error.code === 11000 && error.keyPattern && error.keyPattern.phone) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        phone: "Phone number already exists"
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
            const userId = req.params.id;
            if (userId) {
                const user = await user_service_1.default.findOne(userId);
                return controller.sendSuccessResponse(res, {
                    requestedData: user,
                    message: 'Success'
                });
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'User Id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
    async update(req, res) {
        try {
            const validatedData = user_schema_1.userSchema.safeParse(req.body);
            if (validatedData.success) {
                const userId = req.params.id;
                if (userId) {
                    const user = await user_service_1.default.findOne(userId);
                    const updatedUserData = req.body;
                    const updatedUser = await user_service_1.default.update(userId, {
                        ...updatedUserData,
                        password: user.password === updatedUserData.password ? user.password : await bcrypt_1.default.hash(updatedUserData.password, 10),
                        userImageUrl: (0, helpers_1.handleFileUpload)(req, await user_service_1.default.findOne(userId), req.file, 'userImageUrl', 'user'),
                        updatedAt: new Date()
                    });
                    if (updatedUser) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedUser,
                            message: 'User updated successfully!'
                        }, 200, {
                            sourceFromId: updatedUser._id,
                            sourceFrom: task_log_1.adminTaskLog.account.users,
                            activity: task_log_1.adminTaskLogActivity.update,
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'User Id not found!',
                        });
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'User Id not found! Please try again with UserId',
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
                message: error.message || 'Some error occurred while updating user'
            });
        }
    }
    async destroy(req, res) {
        try {
            const userId = req.params.id;
            if (userId) {
                const user = await user_service_1.default.findOne(userId);
                if (user) {
                    // await UserService.destroy(userId);
                    // return controller.sendSuccessResponse(res, { message: 'User deleted successfully!' });
                    return controller.sendErrorResponse(res, 200, {
                        message: 'You cant to delete this user!',
                    });
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'This user details not found!',
                    });
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'User Id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting user' });
        }
    }
}
exports.default = new UserController();

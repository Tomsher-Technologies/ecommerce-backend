import 'module-alias/register';
import { Request, Response } from 'express';

import { formatZodError, slugify } from '../../../../src/utils/helpers';
import { usertypeSchema } from '../../../../src/utils/schemas/admin/account/user-type-schema';
import { QueryParams } from '../../../../src/utils/types/common';
import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from '../../../../src/constants/admin/task-log';

import BaseController from '../../../../src/controllers/admin/base-controller';
import UserTypeService from '../../../../src/services/admin/account/user-type-service';

const controller = new BaseController();

class UserTypeController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
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
                    { userTypeName: keywordRegex }
                ],
                ...query
            } as any;
        }
        const sort: any = {};
        if (sortby && sortorder) {
            sort[sortby] = sortorder === 'desc' ? -1 : 1;
        }

        try {
            const usersTypes = await UserTypeService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });
            return controller.sendSuccessResponse(res, {
                requestedData: usersTypes,
                totalCount: await UserTypeService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching user types' });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = usertypeSchema.safeParse(req.body);

            if (validatedData.success) {
                const { userTypeName, slug } = validatedData.data;
                const user = res.locals.user;

                const userTypeData = {
                    userTypeName,
                    slug: slug || slugify(userTypeName),
                    status: '1',
                    createdBy: user._id,
                    createdAt: new Date()
                };
                const newUserType = await UserTypeService.create(userTypeData);
                return controller.sendSuccessResponse(res, {
                    requestedData: newUserType,
                    message: 'User type created successfully!'
                }, 200, { // task log
                    sourceFromId: newUserType._id,
                    sourceFrom: adminTaskLog.account.userTypes,
                    activity: adminTaskLogActivity.create,
                    activityStatus: adminTaskLogStatus.success
                });
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                });
            }
        } catch (error: any) {
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


    async findOne(req: Request, res: Response): Promise<void> {
        try {
            const userTypeId = req.params.id;
            if (userTypeId) {
                const userType = await UserTypeService.findOne(userTypeId);
                return controller.sendSuccessResponse(res, {
                    requestedData: userType,
                    message: 'Success'
                });
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'User type Id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = usertypeSchema.safeParse(req.body);
            if (validatedData.success) {
                const userTypeId = req.params.id;
                if (userTypeId) {
                    const updatedUserTypeData = req.body;
                    const updatedUserType = await UserTypeService.update(userTypeId, { ...updatedUserTypeData, updatedAt: new Date() });
                    if (updatedUserType) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedUserType,
                            message: 'User type updated successfully!'
                        }, 200, { // task log
                            sourceFromId: updatedUserType._id,
                            sourceFrom: adminTaskLog.account.userTypes,
                            activity: adminTaskLogActivity.update,
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'User type Id not found!',
                        });
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'User type Id not found! Please try again with User type id',
                    });
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating user type'
            });
        }
    }

    async destroy(req: Request, res: Response): Promise<void> {
        try {
            const userTypeId = req.params.id;
            if (userTypeId) {
                const userType = await UserTypeService.findOne(userTypeId);
                if (userType) {
                    // await UserTypeService.destroy(userTypeId);
                    // return controller.sendSuccessResponse(res, { message: 'User type deleted successfully!' });
                      return controller.sendErrorResponse(res, 200, {
                        message: 'You cant delete this user type',
                    });
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'This user type details not found!',
                    });
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'User type id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting user type' });
        }
    }

}

export default new UserTypeController();
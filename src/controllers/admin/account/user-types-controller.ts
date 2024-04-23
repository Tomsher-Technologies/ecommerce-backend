import 'module-alias/register';
import { Request, Response } from 'express';

import { formatZodError, slugify } from '@utils/helpers';
import { usertypeSchema } from '@utils/schemas/admin/account/user-type-schema';
import { QueryParams } from '@utils/types/common';

import BaseController from '@controllers/admin/base-controller';
import UserTypeService from '@services/admin/account/user-type-service';

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
            controller.sendSuccessResponse(res, {
                requestedData: usersTypes,
                totalCount: await UserTypeService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching user types' });
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
                controller.sendSuccessResponse(res, {
                    requestedData: newUserType,
                    message: 'User type created successfully!'
                });
            } else {
                controller.sendErrorResponse(res, 200, {
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
            controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating user type',
            });
        }
    }


    async findOne(req: Request, res: Response): Promise<void> {
        try {
            const userTypeId = req.params.id;
            if (userTypeId) {
                const userType = await UserTypeService.findOne(userTypeId);
                controller.sendSuccessResponse(res, {
                    requestedData: userType,
                    message: 'Success'
                });
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'User type Id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message });
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
                        controller.sendSuccessResponse(res, {
                            requestedData: updatedUserType,
                            message: 'User type updated successfully!'
                        });
                    } else {
                        controller.sendErrorResponse(res, 200, {
                            message: 'User type Id not found!',
                        });
                    }
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'User type Id not found! Please try again with User type id',
                    });
                }
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, {
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
                    await UserTypeService.destroy(userTypeId);
                    controller.sendSuccessResponse(res, { message: 'User type deleted successfully!' });
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'This user type details not found!',
                    });
                }
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'User type id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting user type' });
        }
    }

}

export default new UserTypeController();
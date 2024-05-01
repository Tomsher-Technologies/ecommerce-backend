
import 'module-alias/register'
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';

import { userSchema } from '@utils/schemas/admin/account/user-schema';
import { formatZodError, handleFileUpload } from '@utils/helpers';
import { QueryParams } from '@utils/types/common';

import UserService from '@services/admin/account/user-service';
import BaseController from '@controllers/admin/base-controller';

const controller = new BaseController();

class UserController extends BaseController {
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
                        { firstName: keywordRegex },
                        { lastName: keywordRegex },
                        { email: keywordRegex },
                        { phone: keywordRegex }
                    ],
                    ...query
                } as any;
            }
            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }

            const users = await UserService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            controller.sendSuccessResponse(res, {
                requestedData: users,
                totalCount: await UserService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching users' });
        }
    }
    async create(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = userSchema.safeParse(req.body);

            if (validatedData.success) {
                const { userTypeID, countryId, email, firstName, lastName, phone, password } = validatedData.data;
                const user = res.locals.user;

                const userData = {
                    userTypeID,
                    countryId,
                    email,
                    firstName,
                    lastName,
                    userImageUrl: handleFileUpload(req, null, req.file, 'userImageUrl', 'user'),
                    phone,
                    password: await bcrypt.hash(password, 10),
                    status: '1',
                    createdBy: user._id,
                    createdAt: new Date()
                };
                const newUser = await UserService.create(userData);
                controller.sendSuccessResponse(res, {
                    requestedData: newUser,
                    message: 'User created successfully!'
                });
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                });
            }
        } catch (error: any) {
            if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        email: "Email already exists"
                    }
                });
            } else if (error.code === 11000 && error.keyPattern && error.keyPattern.phone) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        phone: "Phone number already exists"
                    }
                });
            }
            controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating user'
            });
        }
    }


    async findOne(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.id;
            if (userId) {
                const user = await UserService.findOne(userId);
                controller.sendSuccessResponse(res, {
                    requestedData: user,
                    message: 'Success'
                });
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'User Id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = userSchema.safeParse(req.body);
            if (validatedData.success) {
                const userId = req.params.id;
                if (userId) {
                    const user: any = await UserService.findOne(userId);
                    const updatedUserData = req.body;
                    const updatedUser = await UserService.update(userId, {
                        ...updatedUserData,
                        password: user.password === updatedUserData.password ? user.password : await bcrypt.hash(updatedUserData.password, 10),
                        userImageUrl: handleFileUpload(req, await UserService.findOne(userId), req.file, 'userImageUrl', 'user'),
                        updatedAt: new Date()
                    });
                    if (updatedUser) {
                        controller.sendSuccessResponse(res, {
                            requestedData: updatedUser,
                            message: 'User updated successfully!'
                        });
                    } else {
                        controller.sendErrorResponse(res, 200, {
                            message: 'User Id not found!',
                        });
                    }
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'User Id not found! Please try again with UserId',
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
                message: error.message || 'Some error occurred while updating user'
            });
        }
    }

    async destroy(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.id;
            if (userId) {
                const user = await UserService.findOne(userId);
                if (user) {
                    await UserService.destroy(userId);
                    controller.sendSuccessResponse(res, { message: 'User deleted successfully!' });
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'This user details not found!',
                    });
                }
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'User Id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting user' });
        }
    }
}

export default new UserController();

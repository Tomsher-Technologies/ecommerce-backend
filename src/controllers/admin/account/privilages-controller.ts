
import 'module-alias/register'
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';

import { userSchema } from '@utils/schemas/admin/account/user-schema';
import { formatZodError } from '@utils/helpers';

import BaseController from '@controllers/admin/base-controller';
import PrivilagesService from '@services/admin/account/privilages-service';
import { privilageSchema } from '@utils/schemas/admin/account/privilage-shema';

const controller = new BaseController();

class PrivilagesController extends BaseController {
    async findAll(req: Request, res: Response): Promise<void> {
        try {
            let query: any = { _id: { $exists: true } };


            const privilages = await PrivilagesService.findAll({
                query,
            });

            controller.sendSuccessResponse(res, {
                requestedData: privilages,
                totalCount: await PrivilagesService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching users' });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = privilageSchema.safeParse(req.body);

            if (validatedData.success) {
                const { userTypeID } = validatedData.data;
                const user = res.locals.user;

                const userData = {
                    userTypeID,
                    status: '1',
                    createdBy: user._id,
                    createdAt: new Date()
                };
                const newUser = await PrivilagesService.create(userData);
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
            const userTypeId = req.params.id;
            if (userTypeId) {
                const privilages = await PrivilagesService.findOne(userTypeId);
                if (privilages) {
                    controller.sendSuccessResponse(res, {
                        requestedData: privilages,
                        message: 'Success'
                    });
                } else {
                    controller.sendSuccessResponse(res, {
                        requestedData: {},
                        message: 'Privilages not found!',
                    });
                }
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Privilage Id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }

}

export default new PrivilagesController();

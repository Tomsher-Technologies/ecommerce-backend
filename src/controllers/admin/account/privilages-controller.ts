
import 'module-alias/register'
import { Request, Response } from 'express';

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

    async managePrivilage(req: Request, res: Response): Promise<void> {
        try {
            const userTypeId = req.params.id;
            if (userTypeId) {
                const validatedData = privilageSchema.safeParse(req.body);
                if (validatedData.success) {

                    const {  menuItems, status } = validatedData.data;
                    const privilages = await PrivilagesService.findOne(userTypeId);
                    const user = res.locals.user;

                    let privilageData = {};
                    if (privilages) {// update new privilage based on user type
                        const updatedData = {
                            userTypeId,
                            menuItems,
                            updatedBy: user._id,
                            updatedAt: new Date()
                        };
                        const newPrivilageData = await PrivilagesService.update(privilages._id, updatedData);

                        privilageData = {
                            requestedData: newPrivilageData,
                            message: 'Privilage updated successfully!'
                        };
                    } else { // insert new privilage based on user type
                        const insertData = {
                            userTypeId,
                            menuItems,
                            status: status || '1',
                            createdBy: user._id,
                            createdAt: new Date()
                        };
                        const updatedPrivilageData = await PrivilagesService.create(insertData);

                        privilageData = {
                            requestedData: updatedPrivilageData,
                            message: 'Privilage created successfully!'
                        }
                    }

                    controller.sendSuccessResponse(res, privilageData);
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                        validation: formatZodError(validatedData.error.errors)
                    });
                }
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Privilage Id not found!',
                });
            }
        } catch (error: any) {
            if (error && error.errors && error.errors.userTypeId && error.errors.userTypeId.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        userTypeId: error.errors.userTypeId.properties.message
                    }
                });
            } else if (error && error.errors && error.errors.menuItems && error.errors.menuItems.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        menuItems: error.errors.menuItems.properties.message
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

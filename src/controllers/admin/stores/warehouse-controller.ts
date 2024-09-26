import 'module-alias/register';
import { Request, Response } from 'express';

import { formatZodError, slugify } from '../../../utils/helpers';
import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from '../../../constants/admin/task-log';
import { QueryParams } from '../../../utils/types/common';
import { warehouseSchema, warehouseStatusSchema } from '../../../utils/schemas/admin/store/warehouse-schema';

import BaseController from '../../../controllers/admin/base-controller';
import { WarehouseProps } from '../../../model/admin/stores/warehouse-model';
import WarehouseService from '../../../services/admin/stores/warehouse-service';
import { collections } from '../../../constants/collections';

const controller = new BaseController();

class WarehouseController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '' } = req.query as QueryParams;
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
                        { warehouseTitle: keywordRegex },
                        { warehouseLocation: keywordRegex },
                    ],
                    ...query
                } as any;
            }
            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }

            const warehouses = await WarehouseService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            return controller.sendSuccessResponse(res, {
                requestedData: warehouses,
                totalCount: await WarehouseService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching warehouses' });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = warehouseSchema.safeParse(req.body);
            // console.log('req', req.file);

            if (validatedData.success) {
                const { warehouseTitle, slug, warehouseLocation, deliveryDays, deliveryDelayDays } = validatedData.data;
                const user = res.locals.user;

                const warehouseData: Partial<WarehouseProps> = {
                    warehouseTitle,
                    slug: slug || slugify(warehouseTitle) as any,
                    warehouseLocation,
                    deliveryDays,
                    deliveryDelayDays,
                    status: '1', // active
                    statusAt: new Date(),
                    createdBy: user._id,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                const newWarehouse = await WarehouseService.create(warehouseData);
                return controller.sendSuccessResponse(res, {
                    requestedData: newWarehouse,
                    message: 'Warehouse created successfully!'
                }, 200, { // task log
                    userId: user._id,
                    countryId: user.countryId,
                    sourceCollection: collections.stores.warehouses,
                    referenceData: JSON.stringify(newWarehouse, null, 2),
                    sourceFromId: newWarehouse._id,
                    sourceFrom: adminTaskLog.store.warehouse,
                    activity: adminTaskLogActivity.create,
                    activityComment: 'Warehouse created successfully!',
                    activityStatus: adminTaskLogStatus.success
                });
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) {
            if (error && error.errors && (error.errors?.warehouseTitle) && (error.errors?.warehouseTitle?.properties)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        warehouseTitle: error.errors?.warehouseTitle?.properties.message
                    }
                }, req);
            }
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating warehouse',
            }, req);
        }
    }


    async findOne(req: Request, res: Response): Promise<void> {
        try {
            const warehouseId = req.params.id;
            if (warehouseId) {
                const warehouse = await WarehouseService.findOne(warehouseId);
                return controller.sendSuccessResponse(res, {
                    requestedData: warehouse,
                    message: 'Success'
                });
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Warehouse Id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = warehouseSchema.safeParse(req.body);
            if (validatedData.success) {
                const warehouseId = req.params.id;
                if (warehouseId) {
                    let updatedWarehouseData = req.body;
                    updatedWarehouseData = {
                        ...updatedWarehouseData,
                        updatedAt: new Date()
                    };

                    const updatedWarehouse = await WarehouseService.update(warehouseId, updatedWarehouseData);
                    if (updatedWarehouse) {
                        const user = res.locals.user;
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedWarehouse,
                            message: 'Warehouse updated successfully!'
                        }, 200, { // task log
                            userId: user._id,
                            countryId: user.countryId,
                            sourceCollection: collections.stores.warehouses,
                            referenceData: JSON.stringify(updatedWarehouse, null, 2),
                            sourceFromId: updatedWarehouse._id,
                            sourceFrom: adminTaskLog.store.warehouse,
                            activity: adminTaskLogActivity.update,
                            activityComment: 'Warehouse updated successfully!',
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Warehouse Id not found!',
                        }, req);
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Warehouse Id not found! Please try again with warehouse id',
                    }, req);
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating warehouse'
            }, req);
        }
    }

    async statusChange(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = warehouseStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const warehouse = req.params.id;
                if (warehouse) {
                    let { status } = req.body;
                    const updatedWarehouseData = { status };

                    const updatedWarehouse = await WarehouseService.update(warehouse, updatedWarehouseData);
                    if (updatedWarehouse) {
                        const user = res.locals.user;
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedWarehouse,
                            message: 'warehouse status updated successfully!'
                        }, 200, { // task log
                            userId: user._id,
                            countryId: user.countryId,
                            sourceCollection: collections.stores.warehouses,
                            referenceData: JSON.stringify(updatedWarehouse, null, 2),
                            sourceFromId: updatedWarehouse._id,
                            sourceFrom: adminTaskLog.store.warehouse,
                            activityComment: 'warehouse status updated successfully!',
                            activity: adminTaskLogActivity.statusChange,
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Warehouse Id not found!',
                        }, req);
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Warehouse Id not found! Please try again with warehouse id',
                    }, req);
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating warehouse'
            }, req);
        }
    }

    async destroy(req: Request, res: Response): Promise<void> {
        try {
            const warehouseId = req.params.id;
            if (warehouseId) {
                const warehouse = await WarehouseService.findOne(warehouseId);
                if (warehouse) {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'You cant delete this warehouse!',
                    });
                    // await WarehouseService.destroy(warehouseId);
                    // controller.sendSuccessResponse(res, { message: 'warehouse deleted successfully!' });
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'This warehouse details not found!',
                    });
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Warehouse id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting warehouse' });
        }
    }

}

export default new WarehouseController();
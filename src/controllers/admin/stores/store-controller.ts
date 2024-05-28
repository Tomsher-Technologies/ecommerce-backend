import 'module-alias/register';
import { Request, Response } from 'express';
import mongoose from 'mongoose';

import { formatZodError, slugify } from '../../../utils/helpers';
import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from '../../../constants/admin/task-log';
import { QueryParams } from '../../../utils/types/common';
import { storeSchema } from '../../../utils/schemas/admin/store/store-schema';

import BaseController from '../../../controllers/admin/base-controller';
import StoreService from '../../../services/admin/stores/sore-service';
import { StoreProps } from '../../../model/admin/stores/store-model';

const controller = new BaseController();

class StoreController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { _id = '', page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '' } = req.query as QueryParams;
            let query: any = { _id: { $exists: true } };

            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            } else {
                query.status = '1';
            }

            if (_id) {
                query = {
                    ...query, _id: new mongoose.Types.ObjectId(_id)
                } as any;
            }

            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = {
                    $or: [
                        { storeTitle: keywordRegex },
                        { storePhone: keywordRegex },
                    ],
                    ...query
                } as any;
            }
            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }

            const stores = await StoreService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            return controller.sendSuccessResponse(res, {
                requestedData: stores,
                totalCount: await StoreService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching stores' });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = storeSchema.safeParse(req.body);
            // console.log('req', req.file);

            if (validatedData.success) {
                const { storeTitle, slug, storePhone, storePhone2, storeAddress, storeWorkingHours, storeEmail, storeImageUrl, latitude, longitude } = validatedData.data;
                const user = res.locals.user;

                const storeData: Partial<StoreProps> = {
                    storeTitle,
                    slug: slug || slugify(storeTitle) as any,
                    storePhone,
                    storePhone2,
                    storeAddress,
                    storeWorkingHours,
                    storeEmail,
                    storeImageUrl,
                    latitude,
                    longitude,
                    status: '1', // active
                    statusAt: new Date(),
                    createdBy: user._id,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                const newStore = await StoreService.create(storeData);
                return controller.sendSuccessResponse(res, {
                    requestedData: newStore,
                    message: 'Store created successfully!'
                }, 200, { // task log
                    sourceFromId: newStore._id,
                    sourceFrom: adminTaskLog.store.store,
                    activity: adminTaskLogActivity.create,
                    activityStatus: adminTaskLogStatus.success
                });
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) {
            if (error && error.errors && (error.errors?.storeTitle) && (error.errors?.storeTitle?.properties)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        storeTitle: error.errors?.storeTitle?.properties.message
                    }
                }, req);
            } else if (error && error.errors && (error.errors?.storePhone) && (error.errors?.storePhone?.properties)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        storePhone: error.errors?.storePhone?.properties.message
                    }
                }, req);
            } else if (error && error.errors && (error.errors?.storeEmail) && (error.errors?.storeEmail?.properties)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        storeEmail: error.errors?.storeEmail?.properties.message
                    }
                }, req);
            }
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating store',
            }, req);
        }
    }


    async findOne(req: Request, res: Response): Promise<void> {
        try {
            const storeId = req.params.id;
            if (storeId) {
                const store = await StoreService.findOne(storeId);
                return controller.sendSuccessResponse(res, {
                    requestedData: store,
                    message: 'Success'
                });
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Store Id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = storeSchema.safeParse(req.body);
            if (validatedData.success) {
                const storeId = req.params.id;
                if (storeId) {
                    let updatedStoreData = req.body;
                    updatedStoreData = {
                        ...updatedStoreData,
                        updatedAt: new Date()
                    };

                    const updatedStore = await StoreService.update(storeId, updatedStoreData);
                    if (updatedStore) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedStore,
                            message: 'Store updated successfully!'
                        }, 200, { // task log
                            sourceFromId: updatedStore._id,
                            sourceFrom: adminTaskLog.store.store,
                            activity: adminTaskLogActivity.update,
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Store Id not found!',
                        }, req);
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Store Id not found! Please try again with store id',
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
                message: error.message || 'Some error occurred while updating store'
            }, req);
        }
    }

    async statusChange(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = storeSchema.safeParse(req.body);
            if (validatedData.success) {
                const store = req.params.id;
                if (store) {
                    let { status } = req.body;
                    const updatedStoreData = { status };

                    const updatedStore = await StoreService.update(store, updatedStoreData);
                    if (updatedStore) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedStore,
                            message: 'Store status updated successfully!'
                        }, 200, { // task log
                            sourceFromId: updatedStore._id,
                            sourceFrom: adminTaskLog.store.store,
                            activity: adminTaskLogActivity.statusChange,
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Store Id not found!',
                        }, req);
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Store Id not found! Please try again with store id',
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
                message: error.message || 'Some error occurred while updating store'
            }, req);
        }
    }

    async destroy(req: Request, res: Response): Promise<void> {
        try {
            const storeId = req.params.id;
            if (storeId) {
                const store = await StoreService.findOne(storeId);
                if (store) {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'You cant delete this store!',
                    });
                    // await StoreService.destroy(storeId);
                    // controller.sendSuccessResponse(res, { message: 'store deleted successfully!' });
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'This store details not found!',
                    });
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Store id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting store' });
        }
    }

}

export default new StoreController();
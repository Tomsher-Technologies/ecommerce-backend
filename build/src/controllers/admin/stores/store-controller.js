"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const mongoose_1 = __importDefault(require("mongoose"));
const helpers_1 = require("../../../utils/helpers");
const task_log_1 = require("../../../constants/admin/task-log");
const store_schema_1 = require("../../../utils/schemas/admin/store/store-schema");
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const store_service_1 = __importDefault(require("../../../services/admin/stores/store-service"));
const controller = new base_controller_1.default();
class StoreController extends base_controller_1.default {
    async findAll(req, res) {
        try {
            const { _id = '', page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '' } = req.query;
            let query = { _id: { $exists: true } };
            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            }
            else {
                query.status = '1';
            }
            if (_id) {
                query = {
                    ...query, _id: new mongoose_1.default.Types.ObjectId(_id)
                };
            }
            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = {
                    $or: [
                        { storeTitle: keywordRegex },
                        { storePhone: keywordRegex },
                        { storePhone2: keywordRegex },
                        { storeEmail: keywordRegex },
                        { storeAddress: keywordRegex },
                    ],
                    ...query
                };
            }
            const sort = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const stores = await store_service_1.default.findAll({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort
            });
            return controller.sendSuccessResponse(res, {
                requestedData: stores,
                totalCount: await store_service_1.default.getTotalCount(query),
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching stores' });
        }
    }
    async create(req, res) {
        try {
            const validatedData = store_schema_1.storeSchema.safeParse(req.body);
            // console.log('req', req.file);
            if (validatedData.success) {
                const { storeTitle, slug, storePhone, storePhone2, storeAddress, storeWorkingHours, storeEmail, storeImageUrl, latitude, longitude } = validatedData.data;
                const user = res.locals.user;
                const storeData = {
                    storeTitle,
                    slug: slug || (0, helpers_1.slugify)(storeTitle),
                    storePhone,
                    storePhone2,
                    storeAddress,
                    storeWorkingHours,
                    storeEmail,
                    storeImageUrl: (0, helpers_1.handleFileUpload)(req, null, req.file, 'storeImageUrl', 'store'),
                    latitude,
                    longitude,
                    status: '1', // active
                    statusAt: new Date(),
                    createdBy: user._id,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                const newStore = await store_service_1.default.create(storeData);
                return controller.sendSuccessResponse(res, {
                    requestedData: newStore,
                    message: 'Store created successfully!'
                }, 200, {
                    sourceFromId: newStore._id,
                    sourceFrom: task_log_1.adminTaskLog.store.store,
                    activity: task_log_1.adminTaskLogActivity.create,
                    activityStatus: task_log_1.adminTaskLogStatus.success
                });
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                }, req);
            }
        }
        catch (error) {
            if (error && error.errors && (error.errors?.storeTitle) && (error.errors?.storeTitle?.properties)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        storeTitle: error.errors?.storeTitle?.properties.message
                    }
                }, req);
            }
            else if (error && error.errors && (error.errors?.storePhone) && (error.errors?.storePhone?.properties)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        storePhone: error.errors?.storePhone?.properties.message
                    }
                }, req);
            }
            else if (error && error.errors && (error.errors?.storeEmail) && (error.errors?.storeEmail?.properties)) {
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
    async findOne(req, res) {
        try {
            const storeId = req.params.id;
            if (storeId) {
                const store = await store_service_1.default.findOne(storeId);
                return controller.sendSuccessResponse(res, {
                    requestedData: store,
                    message: 'Success'
                });
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Store Id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
    async update(req, res) {
        try {
            const validatedData = store_schema_1.storeSchema.safeParse(req.body);
            if (validatedData.success) {
                const storeId = req.params.id;
                if (storeId) {
                    let updatedStoreData = req.body;
                    updatedStoreData = {
                        ...updatedStoreData,
                        updatedAt: new Date()
                    };
                    const updatedStore = await store_service_1.default.update(storeId, updatedStoreData);
                    if (updatedStore) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedStore,
                            message: 'Store updated successfully!'
                        }, 200, {
                            sourceFromId: updatedStore._id,
                            sourceFrom: task_log_1.adminTaskLog.store.store,
                            activity: task_log_1.adminTaskLogActivity.update,
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Store Id not found!',
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Store Id not found! Please try again with store id',
                    }, req);
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                }, req);
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating store'
            }, req);
        }
    }
    async statusChange(req, res) {
        try {
            const validatedData = store_schema_1.storeStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const store = req.params.id;
                if (store) {
                    let { status } = req.body;
                    const updatedStoreData = { status };
                    const updatedStore = await store_service_1.default.update(store, updatedStoreData);
                    if (updatedStore) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedStore,
                            message: 'Store status updated successfully!'
                        }, 200, {
                            sourceFromId: updatedStore._id,
                            sourceFrom: task_log_1.adminTaskLog.store.store,
                            activity: task_log_1.adminTaskLogActivity.statusChange,
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Store Id not found!',
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Store Id not found! Please try again with store id',
                    }, req);
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                }, req);
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating store'
            }, req);
        }
    }
    async destroy(req, res) {
        try {
            const storeId = req.params.id;
            if (storeId) {
                const store = await store_service_1.default.findOne(storeId);
                if (store) {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'You cant delete this store!',
                    });
                    // await StoreService.destroy(storeId);
                    // controller.sendSuccessResponse(res, { message: 'store deleted successfully!' });
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'This store details not found!',
                    });
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Store id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting store' });
        }
    }
}
exports.default = new StoreController();

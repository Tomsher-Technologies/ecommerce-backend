"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const helpers_1 = require("../../../utils/helpers");
const task_log_1 = require("../../../constants/admin/task-log");
const warehouse_schema_1 = require("../../../utils/schemas/admin/store/warehouse-schema");
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const warehouse_service_1 = __importDefault(require("../../../services/admin/stores/warehouse-service"));
const collections_1 = require("../../../constants/collections");
const controller = new base_controller_1.default();
class WarehouseController extends base_controller_1.default {
    async findAll(req, res) {
        try {
            const { page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '' } = req.query;
            let query = { _id: { $exists: true } };
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
                        { warehouseTitle: keywordRegex },
                        { warehouseLocation: keywordRegex },
                    ],
                    ...query
                };
            }
            const sort = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const warehouses = await warehouse_service_1.default.findAll({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort
            });
            return controller.sendSuccessResponse(res, {
                requestedData: warehouses,
                totalCount: await warehouse_service_1.default.getTotalCount(query),
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching warehouses' });
        }
    }
    async create(req, res) {
        try {
            const validatedData = warehouse_schema_1.warehouseSchema.safeParse(req.body);
            // console.log('req', req.file);
            if (validatedData.success) {
                const { warehouseTitle, slug, warehouseLocation, deliveryDays, deliveryDelayDays } = validatedData.data;
                const user = res.locals.user;
                const warehouseData = {
                    warehouseTitle,
                    slug: slug || (0, helpers_1.slugify)(warehouseTitle),
                    warehouseLocation,
                    deliveryDays,
                    deliveryDelayDays,
                    status: '1', // active
                    statusAt: new Date(),
                    createdBy: user._id,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                const newWarehouse = await warehouse_service_1.default.create(warehouseData);
                return controller.sendSuccessResponse(res, {
                    requestedData: newWarehouse,
                    message: 'Warehouse created successfully!'
                }, 200, {
                    userId: user._id,
                    countryId: user.countryId,
                    sourceCollection: collections_1.collections.stores.warehouses,
                    referenceData: JSON.stringify(newWarehouse, null, 2),
                    sourceFromId: newWarehouse._id,
                    sourceFrom: task_log_1.adminTaskLog.store.warehouse,
                    activity: task_log_1.adminTaskLogActivity.create,
                    activityComment: 'Warehouse created successfully!',
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
    async findOne(req, res) {
        try {
            const warehouseId = req.params.id;
            if (warehouseId) {
                const warehouse = await warehouse_service_1.default.findOne(warehouseId);
                return controller.sendSuccessResponse(res, {
                    requestedData: warehouse,
                    message: 'Success'
                });
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Warehouse Id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
    async update(req, res) {
        try {
            const validatedData = warehouse_schema_1.warehouseSchema.safeParse(req.body);
            if (validatedData.success) {
                const warehouseId = req.params.id;
                if (warehouseId) {
                    let updatedWarehouseData = req.body;
                    updatedWarehouseData = {
                        ...updatedWarehouseData,
                        updatedAt: new Date()
                    };
                    const updatedWarehouse = await warehouse_service_1.default.update(warehouseId, updatedWarehouseData);
                    if (updatedWarehouse) {
                        const user = res.locals.user;
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedWarehouse,
                            message: 'Warehouse updated successfully!'
                        }, 200, {
                            userId: user._id,
                            countryId: user.countryId,
                            sourceCollection: collections_1.collections.stores.warehouses,
                            referenceData: JSON.stringify(updatedWarehouse, null, 2),
                            sourceFromId: updatedWarehouse._id,
                            sourceFrom: task_log_1.adminTaskLog.store.warehouse,
                            activity: task_log_1.adminTaskLogActivity.update,
                            activityComment: 'Warehouse updated successfully!',
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Warehouse Id not found!',
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Warehouse Id not found! Please try again with warehouse id',
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
                message: error.message || 'Some error occurred while updating warehouse'
            }, req);
        }
    }
    async statusChange(req, res) {
        try {
            const validatedData = warehouse_schema_1.warehouseStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const warehouse = req.params.id;
                if (warehouse) {
                    let { status } = req.body;
                    const updatedWarehouseData = { status };
                    const updatedWarehouse = await warehouse_service_1.default.update(warehouse, updatedWarehouseData);
                    if (updatedWarehouse) {
                        const user = res.locals.user;
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedWarehouse,
                            message: 'warehouse status updated successfully!'
                        }, 200, {
                            userId: user._id,
                            countryId: user.countryId,
                            sourceCollection: collections_1.collections.stores.warehouses,
                            referenceData: JSON.stringify(updatedWarehouse, null, 2),
                            sourceFromId: updatedWarehouse._id,
                            sourceFrom: task_log_1.adminTaskLog.store.warehouse,
                            activityComment: 'warehouse status updated successfully!',
                            activity: task_log_1.adminTaskLogActivity.statusChange,
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Warehouse Id not found!',
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Warehouse Id not found! Please try again with warehouse id',
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
                message: error.message || 'Some error occurred while updating warehouse'
            }, req);
        }
    }
    async destroy(req, res) {
        try {
            const warehouseId = req.params.id;
            if (warehouseId) {
                const warehouse = await warehouse_service_1.default.findOne(warehouseId);
                if (warehouse) {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'You cant delete this warehouse!',
                    });
                    // await WarehouseService.destroy(warehouseId);
                    // controller.sendSuccessResponse(res, { message: 'warehouse deleted successfully!' });
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'This warehouse details not found!',
                    });
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Warehouse id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting warehouse' });
        }
    }
}
exports.default = new WarehouseController();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const helpers_1 = require("../../../utils/helpers");
const tax_shema_1 = require("../../../utils/schemas/admin/setup/tax-shema");
const task_log_1 = require("../../../constants/admin/task-log");
const base_controller_1 = __importDefault(require("../base-controller"));
const tax_service_1 = __importDefault(require("../../../services/admin/setup/tax-service"));
const controller = new base_controller_1.default();
class TaxsController extends base_controller_1.default {
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
                        { taxTitle: keywordRegex },
                    ],
                    ...query
                };
            }
            const sort = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const taxs = await tax_service_1.default.findAll({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort
            });
            return controller.sendSuccessResponse(res, {
                requestedData: taxs,
                totalCount: await tax_service_1.default.getTotalCount(query),
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching taxs' });
        }
    }
    async create(req, res) {
        try {
            const validatedData = tax_shema_1.taxSchema.safeParse(req.body);
            // console.log('req', req.file);
            if (validatedData.success) {
                const { taxTitle, slug, taxPercentage, countryId } = validatedData.data;
                const user = res.locals.user;
                const taxData = {
                    taxTitle,
                    countryId: countryId || (0, helpers_1.getCountryId)(user),
                    slug: slug || (0, helpers_1.slugify)(taxTitle),
                    taxPercentage,
                    status: '1', // active
                    statusAt: new Date(),
                    createdBy: user._id,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                const newTax = await tax_service_1.default.create(taxData);
                return controller.sendSuccessResponse(res, {
                    requestedData: newTax,
                    message: 'Tax created successfully!'
                }, 200, {
                    sourceFromId: newTax._id,
                    sourceFrom: task_log_1.adminTaskLog.setup.taxs,
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
            if (error && error.errors && (error.errors?.taxTitle) && (error.errors?.taxTitle?.properties)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        taxTitle: error.errors?.taxTitle?.properties.message
                    }
                }, req);
            }
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating tax',
            }, req);
        }
    }
    async findOne(req, res) {
        try {
            const taxId = req.params.id;
            if (taxId) {
                const tax = await tax_service_1.default.findOne(taxId);
                return controller.sendSuccessResponse(res, {
                    requestedData: tax,
                    message: 'Success'
                });
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Tax Id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
    async update(req, res) {
        try {
            const validatedData = tax_shema_1.taxSchema.safeParse(req.body);
            if (validatedData.success) {
                const taxId = req.params.id;
                if (taxId) {
                    let updatedTaxData = req.body;
                    updatedTaxData = {
                        ...updatedTaxData,
                        updatedAt: new Date()
                    };
                    const updatedTax = await tax_service_1.default.update(taxId, updatedTaxData);
                    if (updatedTax) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedTax,
                            message: 'Tax updated successfully!'
                        }, 200, {
                            sourceFromId: updatedTax._id,
                            sourceFrom: task_log_1.adminTaskLog.setup.taxs,
                            activity: task_log_1.adminTaskLogActivity.update,
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Tax Id not found!',
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Tax Id not found! Please try again with tax id',
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
                message: error.message || 'Some error occurred while updating tax'
            }, req);
        }
    }
    async statusChange(req, res) {
        try {
            const validatedData = tax_shema_1.taxStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const tax = req.params.id;
                if (tax) {
                    let { status } = req.body;
                    const updatedTaxData = { status };
                    const updatedTax = await tax_service_1.default.update(tax, updatedTaxData);
                    if (updatedTax) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedTax,
                            message: 'Tax status updated successfully!'
                        }, 200, {
                            sourceFromId: updatedTax._id,
                            sourceFrom: task_log_1.adminTaskLog.setup.taxs,
                            activity: task_log_1.adminTaskLogActivity.statusChange,
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Tax Id not found!',
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Tax Id not found! Please try again with tax id',
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
                message: error.message || 'Some error occurred while updating tax'
            }, req);
        }
    }
    async destroy(req, res) {
        try {
            const taxId = req.params.id;
            if (taxId) {
                const tax = await tax_service_1.default.findOne(taxId);
                if (tax) {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'You cant delete this tax!',
                    });
                    // await TaxsService.destroy(taxId);
                    // controller.sendSuccessResponse(res, { message: 'Tax deleted successfully!' });
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'This tax details not found!',
                    });
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Tax id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting tax' });
        }
    }
}
exports.default = new TaxsController();

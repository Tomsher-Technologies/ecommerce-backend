"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const mongoose_1 = __importDefault(require("mongoose"));
const helpers_1 = require("../../../utils/helpers");
const task_log_1 = require("../../../constants/admin/task-log");
const payment_method_schema_1 = require("../../../utils/schemas/admin/setup/payment-method-schema");
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const payment_method_service_1 = __importDefault(require("../../../services/admin/setup/payment-method-service"));
const general_service_1 = __importDefault(require("../../../services/admin/general-service"));
const collections_1 = require("../../../constants/collections");
const controller = new base_controller_1.default();
class PaymentMethodController extends base_controller_1.default {
    async findAll(req, res) {
        try {
            const { page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '', countryId } = req.query;
            let query = { _id: { $exists: true } };
            const userData = await res.locals.user;
            const country = (0, helpers_1.getCountryId)(userData);
            if (country) {
                query.countryId = country;
            }
            else if (countryId) {
                query.countryId = new mongoose_1.default.Types.ObjectId(countryId);
            }
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
                        { paymentMethodTitle: keywordRegex },
                        { subTitle: keywordRegex },
                        { description: keywordRegex },
                    ],
                    ...query
                };
            }
            const sort = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const countries = await payment_method_service_1.default.findAll({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort
            });
            controller.sendSuccessResponse(res, {
                requestedData: countries,
                totalCount: await payment_method_service_1.default.getTotalCount(query),
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching countries' });
        }
    }
    async create(req, res) {
        try {
            const validatedData = payment_method_schema_1.paymentMethodSchema.safeParse(req.body);
            // console.log('req', req.file);
            if (validatedData.success) {
                const { countryId, paymentMethodTitle, operatorName, slug, description, enableDisplay, paymentMethodValues, languageValues } = validatedData.data;
                const user = res.locals.user;
                // const existingPaymentMethod = await PaymentMethodService.findPaymentMethod({ countryId: countryId || getCountryId(user) })
                // if (existingPaymentMethod) {
                //     if (existingPaymentMethod.paymentMethodTitle === paymentMethodTitle) {
                //         controller.sendErrorResponse(res, 500, {
                //             message: 'Payment method title is uniqe'
                //         }, req);
                //     } else if (existingPaymentMethod.slug === slug || slugify(operatorName) as any) {
                //         controller.sendErrorResponse(res, 500, {
                //             message: 'Payment operator name is uniqe'
                //         }, req);
                //     }
                // }
                const paymentMethodData = {
                    countryId: countryId || (0, helpers_1.getCountryId)(user),
                    paymentMethodTitle,
                    slug: slug || (0, helpers_1.slugify)(operatorName),
                    paymentMethodImageUrl: (0, helpers_1.handleFileUpload)(req, null, req.file, 'paymentMethodImageUrl', 'paymentMethod'),
                    description,
                    paymentMethodValues,
                    enableDisplay,
                    status: '1', // active
                    statusAt: new Date(),
                    createdBy: user._id,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                const newPaymentMethod = await payment_method_service_1.default.create(paymentMethodData);
                if (newPaymentMethod) {
                    if (languageValues && Array.isArray(languageValues) && languageValues.length > 0) {
                        await languageValues.map(async (languageValue, index) => {
                            general_service_1.default.multiLanguageFieledsManage(newPaymentMethod._id, languageValue);
                        });
                    }
                    return controller.sendSuccessResponse(res, {
                        requestedData: newPaymentMethod,
                        message: 'PaymentMethod created successfully!'
                    }, 200, {
                        userId: user._id,
                        countryId: user.countryId,
                        sourceCollection: collections_1.collections.setup.paymentMethods,
                        referenceData: JSON.stringify(newPaymentMethod, null, 2),
                        sourceFromId: newPaymentMethod._id,
                        sourceFrom: task_log_1.adminTaskLog.setup.paymentMethod,
                        activity: task_log_1.adminTaskLogActivity.create,
                        activityComment: `PaymentMethod created successfully!`,
                        activityStatus: task_log_1.adminTaskLogStatus.success
                    });
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                }, req);
            }
        }
        catch (error) {
            if (error && error.errors) {
                let validationError = '';
                if (error.errors.paymentMethodTitle && error.errors.paymentMethodTitle.properties) {
                    validationError = {
                        message: 'Validation error',
                        validation: {
                            paymentMethodTitle: error.errors.paymentMethodTitle.properties.message
                        }
                    };
                }
                else if (error.errors.description && error.errors.description.properties) {
                    validationError = {
                        message: 'Validation error',
                        validation: {
                            description: error.errors.description.properties.message
                        }
                    };
                }
                else if (error.errors.paymentMethodValues && error.errors.paymentMethodValues.properties) {
                    validationError = {
                        message: 'Validation error',
                        validation: {
                            paymentMethodValues: error.errors.paymentMethodValues.properties.message
                        }
                    };
                }
                return controller.sendErrorResponse(res, 200, validationError, req);
            }
            else {
                controller.sendErrorResponse(res, 500, {
                    message: error.message || 'Some error occurred while updating paymentMethod'
                }, req);
            }
        }
    }
    async findOne(req, res) {
        try {
            const paymentMethodId = req.params.id;
            if (paymentMethodId) {
                const paymentMethod = await payment_method_service_1.default.findOne(paymentMethodId);
                controller.sendSuccessResponse(res, {
                    requestedData: paymentMethod,
                    message: 'Success'
                });
            }
            else {
                controller.sendErrorResponse(res, 200, {
                    message: 'PaymentMethod Id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
    async update(req, res) {
        try {
            const validatedData = payment_method_schema_1.paymentMethodSchema.safeParse(req.body);
            if (validatedData.success) {
                const paymentMethodId = req.params.id;
                if (paymentMethodId) {
                    let updatedPaymentMethodData = req.body;
                    const user = res.locals.user;
                    updatedPaymentMethodData = {
                        ...updatedPaymentMethodData,
                        paymentMethodImageUrl: (0, helpers_1.handleFileUpload)(req, await payment_method_service_1.default.findOne(paymentMethodId), req.file, 'paymentMethodImageUrl', 'paymentMethod'),
                        updatedAt: new Date()
                    };
                    const updatedPaymentMethod = await payment_method_service_1.default.update(paymentMethodId, updatedPaymentMethodData);
                    if (updatedPaymentMethod) {
                        let newLanguageValues = [];
                        if (updatedPaymentMethodData.languageValues && Array.isArray(updatedPaymentMethodData.languageValues) && updatedPaymentMethodData.languageValues.length > 0) {
                            for (let i = 0; i < updatedPaymentMethodData.languageValues.length; i++) {
                                const languageValue = updatedPaymentMethodData.languageValues[i];
                                const languageValues = await general_service_1.default.multiLanguageFieledsManage(updatedPaymentMethod._id, languageValue);
                                newLanguageValues.push(languageValues);
                            }
                        }
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedPaymentMethod,
                            message: 'PaymentMethod updated successfully!'
                        }, 200, {
                            userId: user._id,
                            countryId: user.countryId,
                            sourceCollection: collections_1.collections.setup.paymentMethods,
                            referenceData: JSON.stringify(updatedPaymentMethod, null, 2),
                            sourceFromId: updatedPaymentMethod._id,
                            sourceFrom: task_log_1.adminTaskLog.setup.paymentMethod,
                            activityComment: 'PaymentMethod updated successfully!',
                            activity: task_log_1.adminTaskLogActivity.update,
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'PaymentMethod Id not found!',
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'PaymentMethod Id not found! Please try again with paymentMethod id',
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
            if (error && error.errors) {
                let validationError = '';
                if (error.errors.paymentMethodTitle && error.errors.paymentMethodTitle.properties) {
                    validationError = {
                        message: 'Validation error',
                        validation: {
                            paymentMethodTitle: error.errors.paymentMethodTitle.properties.message
                        }
                    };
                }
                else if (error.errors.description && error.errors.description.properties) {
                    validationError = {
                        message: 'Validation error',
                        validation: {
                            description: error.errors.description.properties.message
                        }
                    };
                }
                else if (error.errors.paymentMethodValues && error.errors.paymentMethodValues.properties) {
                    validationError = {
                        message: 'Validation error',
                        validation: {
                            paymentMethodValues: error.errors.paymentMethodValues.properties.message
                        }
                    };
                }
                return controller.sendErrorResponse(res, 200, validationError, req);
            }
            else {
                return controller.sendErrorResponse(res, 500, {
                    message: error.message || 'Some error occurred while updating paymentMethod'
                }, req);
            }
        }
    }
    async statusChange(req, res) {
        try {
            const validatedData = payment_method_schema_1.paymentMethodStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const paymentMethodId = req.params.id;
                if (paymentMethodId) {
                    let { status } = req.body;
                    const updatedPaymentMethodData = { status };
                    const user = res.locals.user;
                    const updatedPaymentMethod = await payment_method_service_1.default.update(paymentMethodId, updatedPaymentMethodData);
                    if (updatedPaymentMethod) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedPaymentMethod,
                            message: 'PaymentMethod status updated successfully!'
                        }, 200, {
                            userId: user._id,
                            countryId: user.countryId,
                            sourceCollection: collections_1.collections.setup.paymentMethods,
                            referenceData: JSON.stringify(updatedPaymentMethod, null, 2),
                            sourceFromId: updatedPaymentMethod._id,
                            sourceFrom: task_log_1.adminTaskLog.setup.paymentMethod,
                            activityComment: 'PaymentMethod status updated successfully!',
                            activity: task_log_1.adminTaskLogActivity.statusChange,
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'PaymentMethod Id not found!',
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'PaymentMethod Id not found! Please try again with paymentMethod id',
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
                message: error.message || 'Some error occurred while updating brand'
            }, req);
        }
    }
    async destroy(req, res) {
        try {
            const paymentMethodId = req.params.id;
            if (paymentMethodId) {
                const paymentMethod = await payment_method_service_1.default.findOne(paymentMethodId);
                if (paymentMethod) {
                    // await PaymentMethodService.destroy(paymentMethodId);
                    // controller.sendSuccessResponse(res, { message: 'PaymentMethod deleted successfully!' });
                    controller.sendErrorResponse(res, 200, {
                        message: 'You cant delete this paymentMethod!',
                    });
                }
                else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'This PaymentMethod details not found!',
                    });
                }
            }
            else {
                controller.sendErrorResponse(res, 200, {
                    message: 'PaymentMethod id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting paymentMethod' });
        }
    }
}
exports.default = new PaymentMethodController();

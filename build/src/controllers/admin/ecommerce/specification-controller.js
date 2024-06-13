"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const helpers_1 = require("../../../utils/helpers");
const specification_schema_1 = require("../../../utils/schemas/admin/ecommerce/specification-schema");
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const specification_service_1 = __importDefault(require("../../../services/admin/ecommerce/specification-service"));
const general_service_1 = __importDefault(require("../../../services/admin/general-service"));
const multi_languages_1 = require("../../../constants/multi-languages");
const task_log_1 = require("../../../constants/admin/task-log");
const mongoose_1 = __importDefault(require("mongoose"));
const controller = new base_controller_1.default();
class SpecificationController extends base_controller_1.default {
    async findAll(req, res) {
        try {
            const { page_size = 1, limit = 10, sortby = '', sortorder = '', keyword = '', _id = '' } = req.query;
            let query = { _id: { $exists: true } };
            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = {
                    $or: [
                        { specificationTitle: keywordRegex }
                    ],
                    ...query
                };
            }
            if (_id) {
                query = {
                    ...query, _id: new mongoose_1.default.Types.ObjectId(_id)
                };
            }
            const sort = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const specifications = await specification_service_1.default.findAll({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort
            });
            controller.sendSuccessResponse(res, {
                requestedData: specifications,
                totalCount: await specification_service_1.default.getTotalCount(query),
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching specifications' });
        }
    }
    async create(req, res) {
        try {
            const validatedData = specification_schema_1.specificationSchema.safeParse(req.body);
            // console.log('req', req.file);
            if (validatedData.success) {
                const { specificationTitle, specificationValues, languageValues } = validatedData.data;
                const specificationData = {
                    specificationTitle: await general_service_1.default.capitalizeWords(specificationTitle),
                    status: '1',
                    slug: (0, helpers_1.slugify)(specificationTitle),
                    createdAt: new Date(),
                };
                const newSpecification = await specification_service_1.default.create(specificationData);
                if (newSpecification) {
                    let specificationDetailsValues = [];
                    specificationDetailsValues = await specification_service_1.default.specificationDetailsService(newSpecification._id, specificationValues);
                    if (specificationDetailsValues && languageValues && Array.isArray(languageValues) && languageValues.length > 0) {
                        await languageValues?.map(async (languageValue, index) => {
                            const setSpecificationDetailsValues = languageValue.languageValues.specificationValues.map((specificationLanguageValue, specificationIndex) => {
                                return {
                                    ...specificationLanguageValue,
                                    specificationDetailId: specificationDetailsValues[specificationIndex]._id,
                                    specificationId: specificationDetailsValues[specificationIndex].specificationId,
                                };
                            });
                            if (setSpecificationDetailsValues && setSpecificationDetailsValues.length > 0) {
                                const languageValues = general_service_1.default.multiLanguageFieledsManage(newSpecification._id, {
                                    ...languageValue,
                                    source: multi_languages_1.multiLanguageSources.ecommerce.specifications,
                                    languageValues: {
                                        specificationTitle: languageValue.languageValues.specificationTitle,
                                        specificationValues: setSpecificationDetailsValues,
                                    }
                                });
                            }
                        });
                    }
                    return controller.sendSuccessResponse(res, {
                        requestedData: {
                            _id: newSpecification._id,
                            specificationTitle: newSpecification.specificationTitle,
                            specificationValues: specificationDetailsValues,
                            languageValues: languageValues
                        },
                        message: 'Specification created successfully!'
                    }, 200, {
                        sourceFromId: newSpecification._id,
                        sourceFrom: task_log_1.adminTaskLog.ecommerce.specifications,
                        activity: task_log_1.adminTaskLogActivity.update,
                        activityStatus: task_log_1.adminTaskLogStatus.success
                    });
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
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
        catch (error) {
            if (error && error.errors && (error.errors?.$specificationTitle) && (error.errors?.specificationTitle?.properties)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        specificationTitle: error.errors?.specificationTitle?.properties.message
                    }
                }, req);
            }
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating specification',
            }, req);
        }
    }
    async findOne(req, res) {
        try {
            const specificationId = req.params.id;
            if (specificationId) {
                const specification = await specification_service_1.default.findOne(specificationId);
                controller.sendSuccessResponse(res, {
                    requestedData: specification,
                    message: 'Success'
                });
            }
            else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Specification Id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
    async update(req, res) {
        try {
            const validatedData = specification_schema_1.specificationSchema.safeParse(req.body);
            if (validatedData.success) {
                const specificationId = req.params.id;
                if (specificationId) {
                    let updatedSpecificationData = req.body;
                    updatedSpecificationData = {
                        ...updatedSpecificationData,
                        specificationTitle: await general_service_1.default.capitalizeWords(updatedSpecificationData.specificationTitle),
                        updatedAt: new Date()
                    };
                    const updatedSpecification = await specification_service_1.default.update(specificationId, updatedSpecificationData);
                    if (updatedSpecification) {
                        if (updatedSpecification) {
                            const newValue = await specification_service_1.default.specificationDetailsService(updatedSpecification._id, validatedData.data.specificationValues);
                            let newLanguageValues = [];
                            if (updatedSpecificationData.languageValues && Array.isArray(updatedSpecificationData.languageValues) && updatedSpecificationData.languageValues.length > 0) {
                                for (let i = 0; i < updatedSpecificationData.languageValues.length; i++) {
                                    const languageValue = updatedSpecificationData.languageValues[i];
                                    const languageValues = await general_service_1.default.multiLanguageFieledsManage(updatedSpecification._id, {
                                        ...languageValue,
                                        languageValues: {
                                            ...languageValue.languageValues,
                                        }
                                    });
                                    newLanguageValues.push(languageValues);
                                }
                            }
                            return controller.sendSuccessResponse(res, {
                                requestedData: {
                                    _id: updatedSpecification._id,
                                    specificationTitle: updatedSpecification.specificationTitle,
                                    specificationValues: newValue,
                                    languageValues: newLanguageValues
                                },
                                message: 'Specification updated successfully!'
                            }, 200, {
                                sourceFromId: updatedSpecification._id,
                                sourceFrom: task_log_1.adminTaskLog.ecommerce.specifications,
                                activity: task_log_1.adminTaskLogActivity.update,
                                activityStatus: task_log_1.adminTaskLogStatus.success
                            });
                        }
                        else {
                            return controller.sendErrorResponse(res, 200, {
                                message: 'Validation error',
                            }, req);
                        }
                    }
                    else {
                        controller.sendErrorResponse(res, 200, {
                            message: 'Specification Id not found!',
                        }, req);
                    }
                }
                else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Specification Id not found! Please try again with specification id',
                    }, req);
                }
            }
            else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                }, req);
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating specification'
            }, req);
        }
    }
    async statusChange(req, res) {
        try {
            const validatedData = specification_schema_1.specificationStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const specificationId = req.params.id;
                if (specificationId) {
                    let { status } = req.body;
                    const updatedSpecificationData = { status };
                    const updatedSpecification = await specification_service_1.default.update(specificationId, updatedSpecificationData);
                    if (updatedSpecification) {
                        controller.sendSuccessResponse(res, {
                            requestedData: updatedSpecification,
                            message: 'Specification status updated successfully!'
                        }, 200, {
                            sourceFromId: updatedSpecification._id,
                            sourceFrom: task_log_1.adminTaskLog.ecommerce.specifications,
                            activity: task_log_1.adminTaskLogActivity.statusChange,
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        controller.sendErrorResponse(res, 200, {
                            message: 'Specification Id not found!',
                        }, req);
                    }
                }
                else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Specification Id not found! Please try again with specification id',
                    }, req);
                }
            }
            else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                }, req);
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating specification'
            }, req);
        }
    }
    async destroy(req, res) {
        try {
            const specificationId = req.params.id;
            if (specificationId) {
                const specification = await specification_service_1.default.findOne(specificationId);
                if (specification) {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Cant to be delete specification!!',
                    });
                    // await SpecificationService.destroy(specificationId);
                    // controller.sendSuccessResponse(res, { message: 'Specification deleted successfully!' });
                }
                else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'This specification details not found!',
                    });
                }
            }
            else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Specification id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting specification' });
        }
    }
}
exports.default = new SpecificationController();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const helpers_1 = require("../../../utils/helpers");
const task_log_1 = require("../../../constants/admin/task-log");
const attribute_schema_1 = require("../../../utils/schemas/admin/ecommerce/attribute-schema");
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const attributes_service_1 = __importDefault(require("../../../services/admin/ecommerce/attributes-service"));
const general_service_1 = __importDefault(require("../../../services/admin/general-service"));
const mongoose_1 = __importDefault(require("mongoose"));
const controller = new base_controller_1.default();
class AttributesController extends base_controller_1.default {
    async findAll(req, res) {
        try {
            const { page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '', _id = '' } = req.query;
            let query = { _id: { $exists: true } };
            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = {
                    $or: [
                        { attributeTitle: keywordRegex },
                        { attributeLabel: keywordRegex },
                        { ar_attributeLabel: keywordRegex }
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
            const attributes = await attributes_service_1.default.findAll({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort
            });
            return controller.sendSuccessResponse(res, {
                requestedData: attributes,
                totalCount: await attributes_service_1.default.getTotalCount(query),
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching attributes' });
        }
    }
    async create(req, res) {
        try {
            const validatedData = attribute_schema_1.attributeSchema.safeParse(req.body);
            // console.log('req', req.file);
            if (validatedData.success) {
                const { attributeTitle, attributeType, attributeValues, status, languageValues } = validatedData.data;
                const attributeData = {
                    attributeTitle: (0, helpers_1.capitalizeWords)(attributeTitle),
                    slug: (0, helpers_1.slugify)(attributeTitle),
                    attributeType,
                    status: status || '1',
                    createdAt: new Date(),
                };
                const newAttribute = await attributes_service_1.default.create(attributeData);
                if (newAttribute) {
                    let attributeDetailsValue = [];
                    if (attributeType === 'pattern') {
                        const attributePatternValuesImages = req.files.filter((file) => file.fieldname &&
                            file.fieldname.startsWith('attributeValues[') &&
                            file.fieldname.includes('[itemName]'));
                        if (attributePatternValuesImages.length > 0) {
                            const itemName = attributePatternValuesImages.map((patternImage) => ({
                                itemName: (0, helpers_1.handleFileUpload)(req, null, patternImage, `attributeImageUrl`, 'attributes')
                            }));
                            attributeDetailsValue = await attributes_service_1.default.attributeDetailsService(newAttribute._id, itemName);
                        }
                    }
                    else {
                        console.log("gfdgdfdfhdf`", attributeValues);
                        attributeDetailsValue = await attributes_service_1.default.attributeDetailsService(newAttribute._id, attributeValues);
                    }
                    if (languageValues && Array.isArray(languageValues) && languageValues.length > 0) {
                        await languageValues?.map((languageValue, index) => {
                            if (attributeType === 'pattern') {
                                general_service_1.default.multiLanguageFieledsManage(newAttribute._id, {
                                    languageId: languageValue.languageId,
                                    source: languageValue.source,
                                    languageValues: {
                                        attributeTitle: languageValue.languageValues.attributeTitle,
                                    }
                                });
                            }
                            else {
                                if ((languageValue.attributeTitle !== '') && (languageValue.languageValues?.attributeValues?.length > 0)) {
                                    const languageAttributeValues = languageValue.languageValues.attributeValues.map((attributeValueItem, keyValueIndex) => {
                                        if (attributeDetailsValue[keyValueIndex]) {
                                            return {
                                                attributeId: attributeDetailsValue[keyValueIndex].attributeId,
                                                attributeDetailId: attributeDetailsValue[keyValueIndex]._id,
                                                itemName: attributeValueItem.itemName,
                                                itemValue: attributeValueItem.itemValue,
                                            };
                                        }
                                    });
                                    const languageValues = general_service_1.default.multiLanguageFieledsManage(newAttribute._id, {
                                        ...languageValue,
                                        languageValues: {
                                            ...languageValue.languageValues,
                                            attributeValues: { ...languageAttributeValues }
                                        }
                                    });
                                    // const attributeValues = Object.keys(languageValues)
                                    //     .filter(key => !isNaN(Number(key)))
                                    //     .map((key) => languageValue.languageValues[key]);
                                    // if (attributeValues.length > 0) {
                                    //     const transformedLanguageValues = {
                                    //         attributeValues: attributeValues?.map((attributeValueItem: any, keyValueIndex: number) => {
                                    //             if (attributeDetailsValue[keyValueIndex]) {
                                    //                 return {
                                    //                     attributeId: attributeDetailsValue[keyValueIndex].attributeId,
                                    //                     attributeDetailId: attributeDetailsValue[keyValueIndex]._id,
                                    //                     itemName: attributeValueItem.itemName,
                                    //                     itemValue: attributeValueItem.itemValue,
                                    //                 }
                                    //             }
                                    //         }),
                                    //         attributeTitle: languageValue.languageValues.attributeTitle
                                    //     };
                                    //     GeneralService.multiLanguageFieledsManage(newAttribute._id, {
                                    //         ...languageValue,
                                    //         languageValues: {
                                    //             ...transformedLanguageValues,
                                    //         }
                                    //     })
                                    // }
                                }
                            }
                        });
                    }
                    return controller.sendSuccessResponse(res, {
                        requestedData: {
                            _id: newAttribute._id,
                            attributeTitle: newAttribute.attributeTitle,
                            attributeValues: attributeDetailsValue,
                            languageValues: languageValues,
                            status: newAttribute.status,
                        },
                        message: 'Attribute successfully created'
                    }, 200, {
                        sourceFromId: newAttribute._id,
                        sourceFrom: task_log_1.adminTaskLog.ecommerce.attributes,
                        activity: task_log_1.adminTaskLogActivity.create,
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
            if (error && error.errors && (error.errors?.attributeTitle) && (error.errors?.attributeTitle?.properties)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        attributeTitle: error.errors?.attributeTitle?.properties.message
                    }
                }, req);
            }
            else if (error && error.errors && error.errors?.attributeType && error.errors?.attributeType?.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        attributeType: error.errors?.attributeType?.properties.message
                    }
                }, req);
            }
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating attribute',
            }, req);
        }
    }
    async findOne(req, res) {
        try {
            const attributeId = req.params.id;
            if (attributeId) {
                const attribute = await attributes_service_1.default.findOne(attributeId);
                return controller.sendSuccessResponse(res, {
                    requestedData: attribute,
                    message: 'Success'
                });
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Attribute Id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
    async update(req, res) {
        try {
            const validatedData = attribute_schema_1.attributeSchema.safeParse(req.body);
            if (validatedData.success) {
                const attributeId = req.params.id;
                if (attributeId) {
                    let updatedAttributeData = req.body;
                    updatedAttributeData = {
                        ...updatedAttributeData,
                        attributeTitle: await (0, helpers_1.capitalizeWords)(updatedAttributeData.attributeTitle),
                        updatedAt: new Date()
                    };
                    const updatedAttribute = await attributes_service_1.default.update(attributeId, updatedAttributeData);
                    if (updatedAttribute) {
                        if (updatedAttribute) {
                            let attributeDetailsValue = [];
                            if (updatedAttributeData.attributeType === 'pattern') {
                                const attributePatternValuesImages = req.files.filter((file) => file.fieldname &&
                                    file.fieldname.startsWith('attributeValues[') &&
                                    file.fieldname.includes('[itemName]'));
                                if (attributePatternValuesImages.length > 0) {
                                    const attributeDetails = await attributes_service_1.default.findOne(attributeId);
                                    const newItemName = attributePatternValuesImages.map((patternImage) => {
                                        const index = (0, helpers_1.getIndexFromFieldName)(patternImage.fieldname, 'attributeValues');
                                        let oldItemName = '';
                                        if (index !== -1 && attributeDetails && index < attributeDetails.attributeValues.length) {
                                            oldItemName = attributeDetails[index]?.attributeValues?.itemName;
                                            if ((!oldItemName) || (oldItemName !== undefined)) {
                                                return {
                                                    attributeId: attributeId,
                                                    itemName: (0, helpers_1.handleFileUpload)(req, null, patternImage, 'itemName', 'attributes'),
                                                    itemValue: ''
                                                };
                                            }
                                        }
                                        else {
                                            return {
                                                attributeId: attributeId,
                                                itemName: (0, helpers_1.handleFileUpload)(req, null, patternImage, 'itemName', 'attributes'),
                                                itemValue: ''
                                            };
                                        }
                                    });
                                    const oldAttributeValues = [...updatedAttributeData.attributeValues, ...newItemName];
                                    attributeDetailsValue = await attributes_service_1.default.attributeDetailsService(updatedAttribute._id, oldAttributeValues);
                                }
                                else {
                                    attributeDetailsValue = await attributes_service_1.default.attributeDetailsService(updatedAttribute._id, updatedAttributeData.attributeValues);
                                }
                            }
                            else {
                                attributeDetailsValue = await attributes_service_1.default.attributeDetailsService(updatedAttribute._id, updatedAttributeData.attributeValues);
                            }
                            if (updatedAttributeData.languageValues && Array.isArray(updatedAttributeData.languageValues) && updatedAttributeData.languageValues.length > 0) {
                                await updatedAttributeData.languageValues?.map((languageValue, index) => {
                                    if (updatedAttributeData.attributeType === 'pattern') {
                                        general_service_1.default.multiLanguageFieledsManage(updatedAttribute._id, {
                                            languageId: languageValue.languageId,
                                            source: languageValue.source,
                                            languageValues: {
                                                attributeTitle: languageValue.languageValues.attributeTitle,
                                            }
                                        });
                                    }
                                    else {
                                        general_service_1.default.multiLanguageFieledsManage(updatedAttribute._id, {
                                            ...languageValue,
                                            languageValues: {
                                                ...languageValue.languageValues,
                                            }
                                        });
                                    }
                                });
                            }
                            return controller.sendSuccessResponse(res, {
                                requestedData: {
                                    ...updatedAttribute,
                                    attributeValues: attributeDetailsValue,
                                    languageValues: updatedAttributeData.languageValues
                                },
                                message: 'Attribute successfully updated'
                            }, 200, {
                                sourceFromId: updatedAttribute._id,
                                sourceFrom: task_log_1.adminTaskLog.ecommerce.attributes,
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
                            message: 'Attribute Id not found!',
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Attribute Id not found! Please try again with attribute id',
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
                message: error.message || 'Some error occurred while updating attribute'
            }, req);
        }
    }
    async statusChange(req, res) {
        try {
            const validatedData = attribute_schema_1.attributeStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const attributeId = req.params.id;
                if (attributeId) {
                    let { status } = req.body;
                    const updatedAttributeData = { status };
                    const updatedAttribute = await attributes_service_1.default.update(attributeId, updatedAttributeData);
                    if (updatedAttribute) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedAttribute,
                            message: 'Attribute status updated successfully!'
                        }, 200, {
                            sourceFromId: updatedAttribute._id,
                            sourceFrom: task_log_1.adminTaskLog.ecommerce.attributes,
                            activity: task_log_1.adminTaskLogActivity.statusChange,
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Attribute Id not found!',
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Attribute Id not found! Please try again with attribute id',
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
            const attributeId = req.params.id;
            if (attributeId) {
                const attribute = await attributes_service_1.default.findOne(attributeId);
                if (attribute) {
                    await attributes_service_1.default.destroy(attributeId);
                    return controller.sendSuccessResponse(res, { message: 'Attribute deleted successfully!' });
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'This attribute details not found!',
                    });
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Attribute id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting attribute' });
        }
    }
}
exports.default = new AttributesController();

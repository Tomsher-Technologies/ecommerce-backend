import 'module-alias/register';
import { Request, Response } from 'express';

import { capitalizeWords, formatZodError, getIndexFromFieldName, handleFileUpload, slugify } from '../../../utils/helpers';
import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from '../../../constants/admin/task-log';
import { attributeSchema, attributeStatusSchema } from '../../../utils/schemas/admin/ecommerce/attribute-schema';
import { QueryParams } from '../../../utils/types/common';

import { AttributesProps } from '../../../model/admin/ecommerce/attribute-model';
import BaseController from '../../../controllers/admin/base-controller';
import AttributesService from '../../../services/admin/ecommerce/attributes-service'
import GeneralService from '../../../services/admin/general-service';
import mongoose from 'mongoose';

const controller = new BaseController();

class AttributesController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '', _id = '' } = req.query as QueryParams;
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
                } as any;
            }

            if (_id) {
                query = {
                    ...query, _id: new mongoose.Types.ObjectId(_id)
                } as any;
            }

            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }

            const attributes = await AttributesService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            return controller.sendSuccessResponse(res, {
                requestedData: attributes,
                totalCount: await AttributesService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching attributes' });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = attributeSchema.safeParse(req.body);
            // console.log('req', req.file);

            if (validatedData.success) {
                const { attributeTitle, attributeType, attributeValues, status, languageValues } = validatedData.data;

                const attributeData: Partial<AttributesProps> = {
                    attributeTitle: capitalizeWords(attributeTitle),
                    slug: slugify(attributeTitle),
                    attributeType,
                    status: status || '1',
                    createdAt: new Date(),
                };

                const newAttribute = await AttributesService.create(attributeData);
                if (newAttribute) {
                    let attributeDetailsValue: any = []
                    if (attributeType === 'pattern') {
                        const attributePatternValuesImages = (req as any).files.filter((file: any) =>
                            file.fieldname &&
                            file.fieldname.startsWith('attributeValues[') &&
                            file.fieldname.includes('[itemName]')
                        )

                        if (attributePatternValuesImages.length > 0) {
                            const itemName = attributePatternValuesImages.map((patternImage: any) => ({
                                itemName: handleFileUpload(req, null, patternImage, `attributeImageUrl`, 'attributes')
                            }))
                            attributeDetailsValue = await AttributesService.attributeDetailsService(newAttribute._id, itemName);
                        }
                    } else {
                        console.log("gfdgdfdfhdf`", attributeValues);

                        attributeDetailsValue = await AttributesService.attributeDetailsService(newAttribute._id, attributeValues);
                    }

                    if (languageValues && Array.isArray(languageValues) && languageValues.length > 0) {

                        await languageValues?.map((languageValue: any, index: number) => {
                            if (attributeType === 'pattern') {
                                GeneralService.multiLanguageFieledsManage(newAttribute._id, {
                                    languageId: languageValue.languageId,
                                    source: languageValue.source,
                                    languageValues: {
                                        attributeTitle: languageValue.languageValues.attributeTitle,
                                    }
                                })
                            } else {
                                if ((languageValue.attributeTitle !== '') && (languageValue.languageValues?.attributeValues?.length > 0)) {
                                    const languageAttributeValues = languageValue.languageValues.attributeValues.map((attributeValueItem: any, keyValueIndex: number) => {
                                        if (attributeDetailsValue[keyValueIndex]) {
                                            return {
                                                attributeId: attributeDetailsValue[keyValueIndex].attributeId,
                                                attributeDetailId: attributeDetailsValue[keyValueIndex]._id,
                                                itemName: attributeValueItem.itemName,
                                                itemValue: attributeValueItem.itemValue,
                                            }
                                        }
                                    })
                                    const languageValues = GeneralService.multiLanguageFieledsManage(newAttribute._id, {
                                        ...languageValue,
                                        languageValues: {
                                            ...languageValue.languageValues,
                                            attributeValues: { ...languageAttributeValues }
                                        }
                                    })

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
                        })
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
                    }, 200, {  // task log
                        sourceFromId: newAttribute._id,
                        sourceFrom: adminTaskLog.ecommerce.attributes,
                        activity: adminTaskLogActivity.create,
                        activityStatus: adminTaskLogStatus.success
                    });
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                    }, req);
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) {
            if (error && error.errors && (error.errors?.attributeTitle) && (error.errors?.attributeTitle?.properties)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        attributeTitle: error.errors?.attributeTitle?.properties.message
                    }
                }, req);
            } else if (error && error.errors && error.errors?.attributeType && error.errors?.attributeType?.properties) {
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


    async findOne(req: Request, res: Response): Promise<void> {
        try {
            const attributeId = req.params.id;
            if (attributeId) {
                const attribute = await AttributesService.findOne(attributeId);
                return controller.sendSuccessResponse(res, {
                    requestedData: attribute,
                    message: 'Success'
                });
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Attribute Id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = attributeSchema.safeParse(req.body);
            if (validatedData.success) {
                const attributeId = req.params.id;
                if (attributeId) {
                    let updatedAttributeData = req.body;
                    updatedAttributeData = {
                        ...updatedAttributeData,
                        attributeTitle: await capitalizeWords(updatedAttributeData.attributeTitle),
                        updatedAt: new Date()
                    };


                    const updatedAttribute = await AttributesService.update(attributeId, updatedAttributeData);
                    if (updatedAttribute) {
                        if (updatedAttribute) {

                            let attributeDetailsValue: any = []
                            if (updatedAttributeData.attributeType === 'pattern') {
                                const attributePatternValuesImages = (req as any).files.filter((file: any) =>
                                    file.fieldname &&
                                    file.fieldname.startsWith('attributeValues[') &&
                                    file.fieldname.includes('[itemName]')
                                )
                                if (attributePatternValuesImages.length > 0) {
                                    const attributeDetails: any = await AttributesService.findOne(attributeId);

                                    const newItemName = attributePatternValuesImages.map((patternImage: any) => {
                                        const index = getIndexFromFieldName(patternImage.fieldname, 'attributeValues');
                                        let oldItemName = ''
                                        if (index !== -1 && attributeDetails && index < attributeDetails.attributeValues.length) {
                                            oldItemName = attributeDetails[index]?.attributeValues?.itemName;
                                            if ((!oldItemName) || (oldItemName !== undefined)) {
                                                return {
                                                    attributeId: attributeId,
                                                    itemName: handleFileUpload(req, null, patternImage, 'itemName', 'attributes'),
                                                    itemValue: ''
                                                }
                                            }
                                        } else {
                                            return {
                                                attributeId: attributeId,
                                                itemName: handleFileUpload(req, null, patternImage, 'itemName', 'attributes'),
                                                itemValue: ''
                                            }
                                        }
                                    })

                                    const oldAttributeValues = [...updatedAttributeData.attributeValues, ...newItemName];

                                    attributeDetailsValue = await AttributesService.attributeDetailsService(updatedAttribute._id, oldAttributeValues);
                                } else {
                                    attributeDetailsValue = await AttributesService.attributeDetailsService(updatedAttribute._id, updatedAttributeData.attributeValues);
                                }
                            } else {
                                attributeDetailsValue = await AttributesService.attributeDetailsService(updatedAttribute._id, updatedAttributeData.attributeValues);
                            }

                            if (updatedAttributeData.languageValues && Array.isArray(updatedAttributeData.languageValues) && updatedAttributeData.languageValues.length > 0) {
                                await updatedAttributeData.languageValues?.map((languageValue: any, index: number) => {
                                    if (updatedAttributeData.attributeType === 'pattern') {
                                        GeneralService.multiLanguageFieledsManage(updatedAttribute._id, {
                                            languageId: languageValue.languageId,
                                            source: languageValue.source,
                                            languageValues: {
                                                attributeTitle: languageValue.languageValues.attributeTitle,
                                            }
                                        })
                                    } else {
                                        GeneralService.multiLanguageFieledsManage(updatedAttribute._id, {
                                            ...languageValue,
                                            languageValues: {
                                                ...languageValue.languageValues,
                                            }
                                        })
                                    }
                                })
                            }

                            return controller.sendSuccessResponse(res, {
                                requestedData: {
                                    ...updatedAttribute,
                                    attributeValues: attributeDetailsValue,
                                    languageValues: updatedAttributeData.languageValues
                                },
                                message: 'Attribute successfully updated'
                            }, 200, { // task log
                                sourceFromId: updatedAttribute._id,
                                sourceFrom: adminTaskLog.ecommerce.attributes,
                                activity: adminTaskLogActivity.update,
                                activityStatus: adminTaskLogStatus.success
                            });
                        } else {
                            return controller.sendErrorResponse(res, 200, {
                                message: 'Validation error',
                            }, req);
                        }

                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Attribute Id not found!',
                        }, req);
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Attribute Id not found! Please try again with attribute id',
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
                message: error.message || 'Some error occurred while updating attribute'
            }, req);
        }
    }

    async statusChange(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = attributeStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const attributeId = req.params.id;
                if (attributeId) {
                    let { status } = req.body;
                    const updatedAttributeData = { status };

                    const updatedAttribute = await AttributesService.update(attributeId, updatedAttributeData);
                    if (updatedAttribute) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedAttribute,
                            message: 'Attribute status updated successfully!'
                        }, 200, { // task log
                            sourceFromId: updatedAttribute._id,
                            sourceFrom: adminTaskLog.ecommerce.attributes,
                            activity: adminTaskLogActivity.statusChange,
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Attribute Id not found!',
                        }, req);
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Attribute Id not found! Please try again with attribute id',
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
                message: error.message || 'Some error occurred while updating brand'
            }, req);
        }
    }

    async destroy(req: Request, res: Response): Promise<void> {
        try {
            const attributeId = req.params.id;
            if (attributeId) {
                const attribute = await AttributesService.findOne(attributeId);
                if (attribute) {
                    await AttributesService.destroy(attributeId);
                    return controller.sendSuccessResponse(res, { message: 'Attribute deleted successfully!' });
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'This attribute details not found!',
                    });
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Attribute id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting attribute' });
        }
    }

}

export default new AttributesController();
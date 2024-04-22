import 'module-alias/register';
import { Request, Response } from 'express';

import { formatZodError, handleFileUpload, slugify } from '@utils/helpers';
import { QueryParams } from '@utils/types/common';
import { attributeSchema } from '@utils/schemas/admin/ecommerce/products-schema';

import { AttributesProps } from '@model/admin/ecommerce/attribute-model';
import BaseController from '@controllers/admin/base-controller';
import AttributesService from '@services/admin/ecommerce/attributes-service'

const controller = new BaseController();

class AttributesController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, sortby = '', sortorder = '', keyword = '' } = req.query as QueryParams;
            let query = { _id: { $exists: true } };

            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = {
                    $or: [
                        { attributeTitle: keywordRegex },
                        { en_attributeLabel: keywordRegex },
                        { ar_attributeLabel: keywordRegex }
                    ],
                    ...query
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

            controller.sendSuccessResponse(res, {
                requestedData: attributes,
                totalCount: await AttributesService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching attributes' });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = attributeSchema.safeParse(req.body);
            // console.log('req', req.file);

            if (validatedData.success) {
                const { attributeTitle, en_attributeLabel, ar_attributeLabel, attributeValues } = validatedData.data;

                const attributeData: Partial<AttributesProps> = {
                    attributeTitle,
                    en_attributeLabel,
                    ar_attributeLabel,
                    createdAt: new Date(),
                };

                const newAttribute = await AttributesService.create(attributeData);
                if (newAttribute) {
                    const newValue = await AttributesService.attributeDetailsService(newAttribute._id, attributeValues)
                    return controller.sendSuccessResponse(res, {
                        requestedData: {
                            _id: newAttribute._id,
                            ar_attributeLabel: newAttribute.ar_attributeLabel,
                            en_attributeLabel: newAttribute.en_attributeLabel,
                            attributeValues: newValue
                        },
                        message: 'Please try again!'
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

            if (error && error.errors && error.errors.attributeTitle && error.errors.attributeTitle.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        attributeTitle: error.errors.attributeTitle.properties.message
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
                controller.sendSuccessResponse(res, {
                    requestedData: attribute,
                    message: 'Success'
                });
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Attribute Id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message });
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
                        updatedAt: new Date()
                    };

                    const updatedAttribute = await AttributesService.update(attributeId, updatedAttributeData);
                    if (updatedAttribute) {
                        if (updatedAttribute) {

                            const newValue = await AttributesService.attributeDetailsService(updatedAttribute._id, validatedData.data.attributeValues);

                            return controller.sendSuccessResponse(res, {
                                requestedData: { 
                                    _id: updatedAttribute._id,
                                    ar_attributeLabel: updatedAttribute.ar_attributeLabel,
                                    en_attributeLabel: updatedAttribute.en_attributeLabel,
                                     attributeValues: newValue },
                                message: 'Please try again!'
                            });
                        } else {
                            return controller.sendErrorResponse(res, 200, {
                                message: 'Validation error',
                            }, req);
                        }

                    } else {
                        controller.sendErrorResponse(res, 200, {
                            message: 'Attribute Id not found!',
                        }, req);
                    }
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Attribute Id not found! Please try again with attribute id',
                    }, req);
                }
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating attribute'
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
                    controller.sendSuccessResponse(res, { message: 'Attribute deleted successfully!' });
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'This attribute details not found!',
                    });
                }
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Attribute id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting attribute' });
        }
    }

}

export default new AttributesController();
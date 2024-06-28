import 'module-alias/register';
import mongoose from 'mongoose';
import { Request, Response } from 'express';

import { formatZodError, getCountryId, handleFileUpload, slugify } from '../../../utils/helpers';
import { QueryParams } from '../../../utils/types/common';
import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from '../../../constants/admin/task-log';
import { paymentMethodSchema, paymentMethodStatusSchema } from '../../../utils/schemas/admin/setup/payment-method-schema';

import BaseController from '../../../controllers/admin/base-controller';
import PaymentMethodService from '../../../services/admin/setup/payment-method-service'
import { PaymentMethodProps } from '../../../model/admin/setup/payment-methods-model';
import GeneralService from '../../../services/admin/general-service';
import { multiLanguageSources } from '../../../constants/multi-languages';

const controller = new BaseController();

class PaymentMethodController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '', countryId } = req.query as QueryParams;
            let query: any = { _id: { $exists: true } };

            const userData = await res.locals.user;

            const country = getCountryId(userData);
            if (country) {
                query.countryId = country;
            } else if (countryId) {
                query.countryId = new mongoose.Types.ObjectId(countryId)
            }

            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            } else {
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
                } as any;
            }
            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }

            const countries = await PaymentMethodService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            controller.sendSuccessResponse(res, {
                requestedData: countries,
                totalCount: await PaymentMethodService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching countries' });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = paymentMethodSchema.safeParse(req.body);
            // console.log('req', req.file);

            if (validatedData.success) {
                const { countryId, paymentMethodTitle, operatorName,slug, description, enableDisplay, paymentMethodValues, languageValues } = validatedData.data;
                const user = res.locals.user;

                const paymentMethodData: Partial<PaymentMethodProps> = {
                    countryId: countryId || getCountryId(user),
                    paymentMethodTitle,
                    slug: slug || slugify(operatorName) as any,
                    paymentMethodImageUrl: handleFileUpload(req, null, req.file, 'paymentMethodImageUrl', 'paymentMethod'),
                    description,
                    paymentMethodValues,
                    enableDisplay,
                    status: '1', // active
                    statusAt: new Date(),
                    createdBy: user._id,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                const newPaymentMethod = await PaymentMethodService.create(paymentMethodData);
                if (newPaymentMethod) {
                    if (languageValues && Array.isArray(languageValues) && languageValues.length > 0) {
                        await languageValues.map(async (languageValue: any, index: number) => {
                            GeneralService.multiLanguageFieledsManage(newPaymentMethod._id, languageValue)
                        })
                    }

                    return controller.sendSuccessResponse(res, {
                        requestedData: newPaymentMethod,
                        message: 'PaymentMethod created successfully!'
                    }, 200, { // task log
                        sourceFromId: newPaymentMethod._id,
                        sourceFrom: adminTaskLog.setup.paymentMethod,
                        activity: adminTaskLogActivity.create,
                        activityStatus: adminTaskLogStatus.success
                    });
                }

            } else {

                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) {
            if (error && error.errors) {
                let validationError: any = '';
                if (error.errors.paymentMethodTitle && error.errors.paymentMethodTitle.properties) {
                    validationError = {
                        message: 'Validation error',
                        validation: {
                            paymentMethodTitle: error.errors.paymentMethodTitle.properties.message
                        }
                    }
                } else if (error.errors.description && error.errors.description.properties) {
                    validationError = {
                        message: 'Validation error',
                        validation: {
                            description: error.errors.description.properties.message
                        }
                    }
                } else if (error.errors.paymentMethodValues && error.errors.paymentMethodValues.properties) {
                    validationError = {
                        message: 'Validation error',
                        validation: {
                            paymentMethodValues: error.errors.paymentMethodValues.properties.message
                        }
                    }
                }
                return controller.sendErrorResponse(res, 200, validationError, req);
            } else {
                controller.sendErrorResponse(res, 500, {
                    message: error.message || 'Some error occurred while updating paymentMethod'
                }, req);
            }
        }
    }

    async findOne(req: Request, res: Response): Promise<void> {
        try {
            const paymentMethodId = req.params.id;
            if (paymentMethodId) {
                const paymentMethod = await PaymentMethodService.findOne(paymentMethodId);
                controller.sendSuccessResponse(res, {
                    requestedData: paymentMethod,
                    message: 'Success'
                });
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'PaymentMethod Id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = paymentMethodSchema.safeParse(req.body);
            if (validatedData.success) {
                const paymentMethodId = req.params.id;
                if (paymentMethodId) {
                    let updatedPaymentMethodData = req.body;
                    updatedPaymentMethodData = {
                        ...updatedPaymentMethodData,
                        paymentMethodImageUrl: handleFileUpload(req, await PaymentMethodService.findOne(paymentMethodId), req.file, 'paymentMethodImageUrl', 'paymentMethod'),
                        updatedAt: new Date()
                    };

                    const updatedPaymentMethod = await PaymentMethodService.update(paymentMethodId, updatedPaymentMethodData);
                    if (updatedPaymentMethod) {
                        let newLanguageValues: any = []
                        if (updatedPaymentMethodData.languageValues && Array.isArray(updatedPaymentMethodData.languageValues) && updatedPaymentMethodData.languageValues.length > 0) {
                            for (let i = 0; i < updatedPaymentMethodData.languageValues.length; i++) {
                                const languageValue = updatedPaymentMethodData.languageValues[i];
                                const languageValues = await GeneralService.multiLanguageFieledsManage(updatedPaymentMethod._id, languageValue);

                                newLanguageValues.push(languageValues);
                            }
                        }
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedPaymentMethod,
                            message: 'PaymentMethod updated successfully!'
                        }, 200, { // task log
                            sourceFromId: updatedPaymentMethod._id,
                            sourceFrom: adminTaskLog.setup.paymentMethod,
                            activity: adminTaskLogActivity.update,
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'PaymentMethod Id not found!',
                        }, req);
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'PaymentMethod Id not found! Please try again with paymentMethod id',
                    }, req);
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            if (error && error.errors) {
                let validationError: any = '';
                if (error.errors.paymentMethodTitle && error.errors.paymentMethodTitle.properties) {
                    validationError = {
                        message: 'Validation error',
                        validation: {
                            paymentMethodTitle: error.errors.paymentMethodTitle.properties.message
                        }
                    }
                } else if (error.errors.description && error.errors.description.properties) {
                    validationError = {
                        message: 'Validation error',
                        validation: {
                            description: error.errors.description.properties.message
                        }
                    }
                } else if (error.errors.paymentMethodValues && error.errors.paymentMethodValues.properties) {
                    validationError = {
                        message: 'Validation error',
                        validation: {
                            paymentMethodValues: error.errors.paymentMethodValues.properties.message
                        }
                    }
                }
                return controller.sendErrorResponse(res, 200, validationError, req);
            } else {
                return controller.sendErrorResponse(res, 500, {
                    message: error.message || 'Some error occurred while updating paymentMethod'
                }, req);
            }
        }
    }

    async statusChange(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = paymentMethodStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const paymentMethodId = req.params.id;
                if (paymentMethodId) {
                    let { status } = req.body;
                    const updatedPaymentMethodData = { status };

                    const updatedPaymentMethod = await PaymentMethodService.update(paymentMethodId, updatedPaymentMethodData);
                    if (updatedPaymentMethod) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedPaymentMethod,
                            message: 'PaymentMethod status updated successfully!'
                        }, 200, { // task log
                            sourceFromId: updatedPaymentMethod._id,
                            sourceFrom: adminTaskLog.setup.paymentMethod,
                            activity: adminTaskLogActivity.statusChange,
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'PaymentMethod Id not found!',
                        }, req);
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'PaymentMethod Id not found! Please try again with paymentMethod id',
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
            const paymentMethodId = req.params.id;
            if (paymentMethodId) {
                const paymentMethod = await PaymentMethodService.findOne(paymentMethodId);
                if (paymentMethod) {
                    // await PaymentMethodService.destroy(paymentMethodId);
                    // controller.sendSuccessResponse(res, { message: 'PaymentMethod deleted successfully!' });

                    controller.sendErrorResponse(res, 200, {
                        message: 'You cant delete this paymentMethod!',
                    });
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'This PaymentMethod details not found!',
                    });
                }
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'PaymentMethod id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting paymentMethod' });
        }
    }

}

export default new PaymentMethodController();
import 'module-alias/register';
import { Request, Response } from 'express';

import { formatZodError, getCountryId, slugify } from '../../../utils/helpers';
import { taxSchema, taxStatusSchema } from '../../../utils/schemas/admin/setup/tax-shema';
import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from '../../../constants/admin/task-log';
import { QueryParams } from '../../../utils/types/common';

import BaseController from '../base-controller';
import TaxsService from '../../../services/admin/setup/tax-service';
import { collections } from '../../../constants/collections';

const controller = new BaseController();

class TaxsController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '' } = req.query as QueryParams;
            let query: any = { _id: { $exists: true } };

            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            } else {
                query.status = '1';
            }

            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = {
                    $or: [
                        { taxTitle: keywordRegex },
                    ],
                    ...query
                } as any;
            }
            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }

            const taxs = await TaxsService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            return controller.sendSuccessResponse(res, {
                requestedData: taxs,
                totalCount: await TaxsService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching taxs' });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = taxSchema.safeParse(req.body);
            // console.log('req', req.file);

            if (validatedData.success) {
                const { taxTitle, slug, taxPercentage, countryId } = validatedData.data;
                const user = res.locals.user;

                const taxData = {
                    taxTitle,
                    countryId: countryId || getCountryId(user),
                    slug: slug || slugify(taxTitle) as any,
                    taxPercentage,
                    status: '1', // active
                    statusAt: new Date(),
                    createdBy: user._id,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };


                const newTax = await TaxsService.create(taxData);
                return controller.sendSuccessResponse(res, {
                    requestedData: newTax,
                    message: 'Tax created successfully!'
                }, 200, { // task log
                    userId: user._id,
                    countryId: user.countryId,
                    sourceCollection: collections.setup.taxs,
                    referenceData: JSON.stringify(taxData, null, 2),
                    sourceFromId: newTax._id,
                    sourceFrom: adminTaskLog.setup.taxs,
                    activity: adminTaskLogActivity.create,
                    activityComment: 'Tax created successfully!',
                    activityStatus: adminTaskLogStatus.success
                });
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) {
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


    async findOne(req: Request, res: Response): Promise<void> {
        try {
            const taxId = req.params.id;
            if (taxId) {
                const tax = await TaxsService.findOne(taxId);
                return controller.sendSuccessResponse(res, {
                    requestedData: tax,
                    message: 'Success'
                });
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Tax Id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = taxSchema.safeParse(req.body);
            if (validatedData.success) {
                const taxId = req.params.id;
                if (taxId) {
                    let updatedTaxData = req.body;
                    const user = res.locals.user;
                    updatedTaxData = {
                        ...updatedTaxData,
                        updatedAt: new Date()
                    };

                    const updatedTax = await TaxsService.update(taxId, updatedTaxData);
                    if (updatedTax) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedTax,
                            message: 'Tax updated successfully!'
                        }, 200, { // task log
                            userId: user._id,
                            countryId: user.countryId,
                            sourceCollection: collections.setup.taxs,
                            referenceData: JSON.stringify(updatedTax, null, 2),
                            sourceFromId: updatedTax._id,
                            sourceFrom: adminTaskLog.setup.taxs,
                            activity: adminTaskLogActivity.update,
                            activityComment: 'ax updated successfully!',
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Tax Id not found!',
                        }, req);
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Tax Id not found! Please try again with tax id',
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
                message: error.message || 'Some error occurred while updating tax'
            }, req);
        }
    }

    async statusChange(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = taxStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const tax = req.params.id;
                if (tax) {
                    let { status } = req.body;
                    const updatedTaxData = { status };

                    const updatedTax = await TaxsService.update(tax, updatedTaxData);
                    if (updatedTax) {
                        const user = res.locals.user;
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedTax,
                            message: 'Tax status updated successfully!'
                        }, 200, { // task log
                            userId: user._id,
                            countryId: user.countryId,
                            sourceCollection: collections.setup.taxs,
                            referenceData: JSON.stringify(updatedTax, null, 2),
                            sourceFromId: updatedTax._id,
                            sourceFrom: adminTaskLog.setup.taxs,
                            activity: adminTaskLogActivity.statusChange,
                            activityComment: 'Tax status updated successfully!',
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Tax Id not found!',
                        }, req);
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Tax Id not found! Please try again with tax id',
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
                message: error.message || 'Some error occurred while updating tax'
            }, req);
        }
    }

    async destroy(req: Request, res: Response): Promise<void> {
        try {
            const taxId = req.params.id;
            if (taxId) {
                const tax = await TaxsService.findOne(taxId);
                if (tax) {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'You cant delete this tax!',
                    });
                    // await TaxsService.destroy(taxId);
                    // controller.sendSuccessResponse(res, { message: 'Tax deleted successfully!' });
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'This tax details not found!',
                    });
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Tax id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting tax' });
        }
    }

}

export default new TaxsController();
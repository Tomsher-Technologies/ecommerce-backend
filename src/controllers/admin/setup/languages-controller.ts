import 'module-alias/register';
import { Request, Response } from 'express';

import { formatZodError, slugify } from '../../../utils/helpers';
import { languageSchema, languageStatusSchema } from '../../../utils/schemas/admin/setup/language-shema';
import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from '../../../constants/admin/task-log';
import { QueryParams } from '../../../utils/types/common';

import BaseController from '../../../controllers/admin/base-controller';
import LanguagesService from '../../../services/admin/setup/languages-service';
import { LanguageProps } from '../../../model/admin/setup/language-model';
import { collections } from '../../../constants/collections';

const controller = new BaseController();

class LanguagesController extends BaseController {

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
                        { languageTitle: keywordRegex },
                        { languageCode: keywordRegex },
                    ],
                    ...query
                } as any;
            }
            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }

            const languages = await LanguagesService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            return controller.sendSuccessResponse(res, {
                requestedData: languages,
                totalCount: await LanguagesService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching languages' });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = languageSchema.safeParse(req.body);
            // console.log('req', req.file);

            if (validatedData.success) {
                const { languageTitle, slug, languageCode } = validatedData.data;
                const user = res.locals.user;

                const languageData: Partial<LanguageProps> = {
                    languageTitle,
                    slug: slug || slugify(languageTitle) as any,
                    languageCode,
                    status: '1', // active
                    statusAt: new Date(),
                    createdBy: user._id,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };


                const newLanguage = await LanguagesService.create(languageData);
                return controller.sendSuccessResponse(res, {
                    requestedData: newLanguage,
                    message: 'Language created successfully!'
                }, 200, { // task log
                    userId: user._id,
                    countryId: user.countryId,
                    sourceCollection: collections.setup.languages,
                    referenceData: JSON.stringify(newLanguage, null, 2),
                    sourceFromId: newLanguage._id,
                    sourceFrom: adminTaskLog.setup.languages,
                    activity: adminTaskLogActivity.create,
                    activityComment: 'Language created successfully!',
                    activityStatus: adminTaskLogStatus.success
                });
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) {
            if (error && error.errors && (error.errors?.languageTitle) && (error.errors?.languageTitle?.properties)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        languageTitle: error.errors?.languageTitle?.properties.message
                    }
                }, req);
            }
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating language',
            }, req);
        }
    }


    async findOne(req: Request, res: Response): Promise<void> {
        try {
            const languageId = req.params.id;
            if (languageId) {
                const language = await LanguagesService.findOne(languageId);
                return controller.sendSuccessResponse(res, {
                    requestedData: language,
                    message: 'Success'
                });
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Language Id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = languageSchema.safeParse(req.body);
            if (validatedData.success) {
                const languageId = req.params.id;
                if (languageId) {
                    let updatedLanguageData = req.body;
                    updatedLanguageData = {
                        ...updatedLanguageData,
                        updatedAt: new Date()
                    };

                    const updatedLanguage = await LanguagesService.update(languageId, updatedLanguageData);
                    if (updatedLanguage) {
                        const user = res.locals.user;
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedLanguage,
                            message: 'Language updated successfully!'
                        }, 200, { // task log
                            userId: user._id,
                            countryId: user.countryId,
                            sourceCollection: collections.setup.languages,
                            referenceData: JSON.stringify(updatedLanguage, null, 2),
                            sourceFromId: updatedLanguage._id,
                            sourceFrom: adminTaskLog.setup.languages,
                            activity: adminTaskLogActivity.update,
                            activityComment: 'Language updated successfully!',
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Language Id not found!',
                        }, req);
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Language Id not found! Please try again with language id',
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
                message: error.message || 'Some error occurred while updating language'
            }, req);
        }
    }

    async statusChange(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = languageStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const language = req.params.id;
                if (language) {
                    let { status } = req.body;
                    const updatedLanguageData = { status };

                    const updatedLanguage = await LanguagesService.update(language, updatedLanguageData);
                    if (updatedLanguage) {
                        const user = res.locals.user;
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedLanguage,
                            message: 'Language status updated successfully!'
                        }, 200, { // task log
                            userId: user._id,
                            countryId: user.countryId,
                            sourceCollection: collections.setup.languages,
                            referenceData: JSON.stringify(updatedLanguage, null, 2),
                            sourceFromId: updatedLanguage._id,
                            sourceFrom: adminTaskLog.setup.languages,
                            activity: adminTaskLogActivity.statusChange,
                            activityComment: 'Language status updated successfully!',
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Language Id not found!',
                        }, req);
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Language Id not found! Please try again with language id',
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
                message: error.message || 'Some error occurred while updating language'
            }, req);
        }
    }

    async destroy(req: Request, res: Response): Promise<void> {
        try {
            const languageId = req.params.id;
            if (languageId) {
                const language = await LanguagesService.findOne(languageId);
                if (language) {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'You cant delete this language!',
                    });
                    // await LanguagesService.destroy(languageId);
                    // controller.sendSuccessResponse(res, { message: 'Language deleted successfully!' });
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'This language details not found!',
                    });
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Language id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting language' });
        }
    }

}

export default new LanguagesController();
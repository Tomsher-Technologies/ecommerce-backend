import 'module-alias/register';
import { Request, Response } from 'express';

import { formatZodError, slugify } from '@utils/helpers';
import { languageSchema } from '@utils/schemas/admin/setup/language-shema';
import { QueryParams } from '@utils/types/common';

import BaseController from '@controllers/admin/base-controller';
import LanguagesService from '@services/admin/setup/languages-service';
import { LanguageProps } from '@model/admin/setup/language-model';

const controller = new BaseController();

class LanguagesController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, status = ['1', '2'], sortby = '', sortorder = '', keyword = '' } = req.query as QueryParams;
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

            controller.sendSuccessResponse(res, {
                requestedData: languages,
                totalCount: await LanguagesService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching languages' });
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
                });
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) {
            if (error.code === 11000 && error.keyPattern && error.keyPattern.languageTitle) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        languageTitle: "Language name already exists"
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
                controller.sendSuccessResponse(res, {
                    requestedData: language,
                    message: 'Success'
                });
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Language Id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message });
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
                        controller.sendSuccessResponse(res, {
                            requestedData: updatedLanguage,
                            message: 'Language updated successfully!'
                        });
                    } else {
                        controller.sendErrorResponse(res, 200, {
                            message: 'Language Id not found!',
                        }, req);
                    }
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Language Id not found! Please try again with language id',
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
                    await LanguagesService.destroy(languageId);
                    controller.sendSuccessResponse(res, { message: 'Language deleted successfully!' });
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'This language details not found!',
                    });
                }
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Language id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting language' });
        }
    }

}

export default new LanguagesController();
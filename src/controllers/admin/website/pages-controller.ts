import 'module-alias/register';
import mongoose from 'mongoose';
import { Request, Response } from 'express';

import { checkValueExists, formatZodError, getCountryId, handleFileUpload, slugify } from '../../../utils/helpers';
import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from '../../../constants/admin/task-log';
import { pagesFormSchema } from '../../../utils/schemas/admin/website/pages-shema';
import { blockReferences, websiteSetup } from '../../../constants/website-setup';
import { SettingFindOneWithCountryQueryParams, } from '../../../utils/types/settings';

import BaseController from '../base-controller';
import PagesService from '../../../services/admin/website/pages-service';
import GeneralService from '../../../services/admin/general-service';
import MultiLanguageFieledsModel from '../../../model/admin/multi-language-fieleds-model';

const controller = new BaseController();


class PageController extends BaseController {

    async manageWithCountryId(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = pagesFormSchema.safeParse(req.body);
            // console.log('req', (req as any).files);
            const userData = await res.locals.user;
            let countryId = req.params.id || req.body.countryId || getCountryId(userData);
            if (validatedData.success) {
                if (countryId && typeof countryId === 'string') {
                    countryId = decodeURIComponent(countryId).replace(/[^a-fA-F0-9]/g, '');
                }
                const { block, blockReference, websiteSetupId, blockValues, status, languageSources, languageValues } = validatedData.data;
                if ((checkValueExists(websiteSetup, block) && (checkValueExists(blockReferences, blockReference)))) {
                    const user = res.locals.user;
                    let aboutImageUrl= (blockValues as any)?.aboutImageUrl || '';
                    let aboutImageUrl2= (blockValues as any)?.aboutImageUrl2 || '';
                    let contactImageUrl = (blockValues as any)?.contactImageUrl || '';
                    let contactImageUrl2= (blockValues as any)?.contactImageUrl2 || '';
                    if (req.files) {
                        const aboutImage = (req as any).files.filter((file: any) => file.fieldname && file.fieldname.startsWith('blockValues[') && file.fieldname.includes('[aboutImage]'));
                        const aboutImage2 = (req as any).files.filter((file: any) => file.fieldname && file.fieldname.startsWith('blockValues[') && file.fieldname.includes('[aboutImage2]'));

                        aboutImageUrl = handleFileUpload(req, null, aboutImage?.length > 0 ? aboutImage[0] : null, 'aboutImageUrl', 'website') || (blockValues as any)?.aboutImageUrl;
                        aboutImageUrl2 = handleFileUpload(req, null, aboutImage2?.length > 0 ? aboutImage2[0] : null, 'aboutImageUrl2', 'website') || (blockValues as any)?.aboutImageUrl2;

                        const contactImage = (req as any).files.filter((file: any) => file.fieldname && file.fieldname.startsWith('blockValues[') && file.fieldname.includes('[contactImage]'));
                        const contactImage2 = (req as any).files.filter((file: any) => file.fieldname && file.fieldname.startsWith('blockValues[') && file.fieldname.includes('[contactImage2]'));

                        contactImageUrl = handleFileUpload(req, null, contactImage?.length > 0 ? contactImage[0] : null, 'contactImageUrl', 'website') || (blockValues as any)?.contactImageUrl;
                        contactImageUrl2 = handleFileUpload(req, null, contactImage2?.length > 0 ? contactImage2[0] : null, 'contactImageUrl2', 'website') || (blockValues as any)?.contactImageUrl2
                    }

                    const pagesData: Partial<any> = {
                        countryId: new mongoose.Types.ObjectId(countryId),
                        block,
                        blockReference,
                        blockValues: {
                            ...blockValues,
                            ...(blockReferences.aboutUs === blockReference && aboutImageUrl !== null && aboutImageUrl !== '' ? { aboutImageUrl } : {}),
                            ...(blockReferences.aboutUs === blockReference && aboutImageUrl2 !== null && aboutImageUrl2 !== '' ? { aboutImageUrl2 } : {}),
                            ...(blockReferences.contactUs === blockReference && contactImageUrl !== null && contactImageUrl !== '' ? { contactImageUrl } : {}),
                            ...(blockReferences.contactUs === blockReference && contactImageUrl2 !== null && contactImageUrl2 !== '' ? { contactImageUrl2 } : {})
                        },
                        status: status || '1', // active
                        createdBy: user._id,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };

                    let newPagesData: any = [];
                    const websitePageResult = await PagesService.findOne({ countryId: countryId, block: block, blockReference: blockReference });

                    if (!websitePageResult) {
                        newPagesData = await PagesService.create(pagesData);
                    } else {
                        newPagesData = await PagesService.update(websitePageResult._id, pagesData);
                    }

                    if (newPagesData && languageSources && languageValues && Array.isArray(languageValues) && languageValues.length > 0) {
                        await languageValues.map(async (languageValue: any, index: number) => {
                            await GeneralService.multiLanguageFieledsManage(newPagesData._id, {
                                ...languageValue,
                                source: languageSources,
                                sourceId: newPagesData._id,
                            });

                        })
                    }

                    return controller.sendSuccessResponse(res, {
                        requestedData: newPagesData,
                        message: 'Language created successfully!'
                    }, 200, { // task log
                        sourceFromId: newPagesData._id,
                        sourceFrom: (adminTaskLog as any).website.pages[blockReference],
                        activity: websiteSetupId ? adminTaskLogActivity.update : adminTaskLogActivity.create,
                        activityStatus: adminTaskLogStatus.success
                    });
                } else {
                    return controller.sendErrorResponse(res, 500, {
                        message: 'Block values are incorrect',
                    }, req);
                }

            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) {
            if (error && error.errors && (error.errors?.blockReference) && (error.errors?.blockReference?.properties)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        blockReference: error.errors?.blockReference?.properties.message
                    }
                }, req);
            } else if (error && error.errors && (error.errors?.block) && (error.errors?.block?.properties)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        block: error.errors?.block?.properties.message
                    }
                }, req);
            }
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating language',
            }, req);
        }
    }


    async findOneWithCountryId(req: Request, res: Response): Promise<void> {
        try {
            const countryId = req.params.id;
            if (countryId) {
                const { websiteSetupId, block, blockReference, languageSources } = req.query as unknown as SettingFindOneWithCountryQueryParams;
                if ((checkValueExists(websiteSetup, block) && (checkValueExists(blockReferences, blockReference)))) {
                    const websitePageData: any = await PagesService.findOne({ countryId, block, blockReference });

                    if (languageSources && websitePageData) {
                        const languageValues = await MultiLanguageFieledsModel.find({ source: languageSources, sourceId: websitePageData._id });

                        return controller.sendSuccessResponse(res, {
                            requestedData: {
                                _id: websitePageData._id,
                                countryId: websitePageData.countryId,
                                block: websitePageData.block,
                                blockReference: websitePageData.blockReference,
                                blockValues: websitePageData.blockValues,
                                status: websitePageData.status,
                                languageValues: languageValues ?? []
                            },
                            message: 'Success'
                        });
                    } else {
                        return controller.sendSuccessResponse(res, {
                            requestedData: websitePageData,
                            message: 'Success'
                        });
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'block and block reference is missing!',
                    });
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Country id with navigation page not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
}

export default new PageController();
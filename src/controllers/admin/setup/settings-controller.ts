import 'module-alias/register';
import { Request, Response } from 'express';

import { checkValueExists, formatZodError, getCountryId, handleFileUpload, slugify } from '../../../utils/helpers';
import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from '../../../constants/admin/task-log';
import { settingsFormSchema } from '../../../utils/schemas/admin/setup/basic-settings';
import { blockReferences, websiteSetup } from '../../../constants/website-setup';
import { SettingFindOneWithCountryQueryParams, } from '../../../utils/types/settings';

import BaseController from '../base-controller';
import SettingsService from '../../../services/admin/setup/settings-service';
import GeneralService from '../../../services/admin/general-service';
import mongoose from 'mongoose';
import { collections } from '../../../constants/collections';

const controller = new BaseController();


class SettingsController extends BaseController {

    async manageWithCountryId(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = settingsFormSchema.safeParse(req.body);
            // console.log('req', (req as any).files);
            const userData = await res.locals.user;
            let countryId = req.params.id || req.body.countryId || getCountryId(userData);
            if (validatedData.success) {
                if (countryId && typeof countryId === 'string') {
                    countryId = decodeURIComponent(countryId).replace(/[^a-fA-F0-9]/g, '');
                }
                const { languageId, block, blockReference, websiteSetupId, blockValues, status, languageSources, languageValues } = validatedData.data;
                if ((checkValueExists(websiteSetup, block) && (checkValueExists(blockReferences, blockReference)))) {
                    const user = res.locals.user;

                    const newFavIcon = (req as any).files?.filter((file: any) => file.fieldname && file.fieldname.startsWith('blockValues[favIcon]') && file.fieldname.includes('blockValues[favIcon]'));
                    const newWebsiteLogo = (req as any).files?.filter((file: any) => file.fieldname && file.fieldname.startsWith('blockValues[websiteLogo]') && file.fieldname.includes('blockValues[websiteLogo]'));

                    if (blockReferences.basicDetailsSettings === blockReference) {
                        delete blockValues.languageValues;
                    }

                    const settingsData: Partial<any> = {
                        countryId: blockReference !== 'global-values' ? new mongoose.Types.ObjectId(countryId) : null,
                        block,
                        blockReference,
                        blockValues: {
                            ...(blockReferences.websiteSettings === blockReference ? {
                                primaryColor: blockValues.primaryColor,
                                secondaryColor: blockValues.secondaryColor,
                                websiteLogoUrl: (newWebsiteLogo && newWebsiteLogo.length > 0 ? true : false) ? handleFileUpload(req, null, newWebsiteLogo[0], 'websiteLogoUrl', 'basicsettings') : blockValues.favIconUrl,
                                favIconUrl: (newFavIcon && newFavIcon.length > 0 ? true : false) ? handleFileUpload(req, null, newFavIcon[0], 'favIconUrl', 'basicsettings') : blockValues.websiteLogoUrl,
                            } : blockValues)
                        },
                        status: status || '1', // active
                        createdBy: user._id,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };

                    let newBasicSettings: any = [];
                    if (!languageId) {
                        const websiteSettingResult = await SettingsService.findOne({ countryId: countryId, block: block, blockReference: blockReference });

                        if (!websiteSettingResult) {
                            newBasicSettings = await SettingsService.create(settingsData);
                        } else {
                            newBasicSettings = await SettingsService.update(websiteSettingResult._id, settingsData);
                        }
                    } else {
                        if (websiteSetupId) {
                            if (languageSources && languageValues) {
                                const languageValuesData = await GeneralService.multiLanguageFieledsManage(websiteSetupId, {
                                    languageId,
                                    source: languageSources,
                                    sourceId: websiteSetupId,
                                    languageValues: languageValues
                                });

                                if (languageValuesData) {
                                    newBasicSettings = languageValuesData?.languageValues
                                } else {
                                    return controller.sendErrorResponse(res, 200, {
                                        message: 'Something went wrong on when website setup insertion. Please try again!',
                                    }, req);
                                }
                            } else {
                                return controller.sendErrorResponse(res, 200, {
                                    message: 'language sources is missing',
                                }, req);
                            }
                        } else {
                            return controller.sendErrorResponse(res, 200, {
                                message: 'Please create atleast one main website setup',
                            }, req);
                        }
                    }

                    return controller.sendSuccessResponse(res, {
                        requestedData: newBasicSettings,
                        message: 'Setting changed successfully!'
                    }, 200, { // task log
                        userId: user._id,
                        countryId: user.countryId,
                        sourceCollection: collections.setup.websiteSetups,
                        referenceData: JSON.stringify(newBasicSettings, null, 2),
                        sourceFromId: newBasicSettings._id,
                        sourceFrom: (adminTaskLog as any).setup.settings[blockReference],
                        activity: websiteSetupId ? adminTaskLogActivity.update : adminTaskLogActivity.create,
                        activityComment: `${block} => ${blockReference} => Setting changed successfully!`,
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
                const { websiteSetupId, languageId, block, blockReference, languageSources } = req.query as unknown as SettingFindOneWithCountryQueryParams;
                if ((checkValueExists(websiteSetup, block) && (checkValueExists(blockReferences, blockReference)))) {
                    const websiteSettingData: any = await SettingsService.findOne({ countryId, block, blockReference });

                    if (languageId && languageSources && websiteSettingData) {
                        const languageValues = await GeneralService.findOneLanguageValues(languageSources, websiteSettingData._id, languageId);
                        console.log('languageValues', languageValues);

                        if (languageValues) {
                            return controller.sendSuccessResponse(res, {
                                requestedData: languageValues.languageValues,
                                message: 'Success'
                            });
                        } else {
                            return controller.sendErrorResponse(res, 200, {
                                message: 'Not found on this language setting item. Please try to add new setting item!',
                            });
                        }
                    } else {
                        return controller.sendSuccessResponse(res, {
                            requestedData: websiteSettingData,
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
                    message: 'Country id with navigation setting not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
}

export default new SettingsController();
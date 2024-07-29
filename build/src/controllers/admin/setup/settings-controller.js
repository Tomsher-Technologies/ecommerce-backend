"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const helpers_1 = require("../../../utils/helpers");
const task_log_1 = require("../../../constants/admin/task-log");
const basic_settings_1 = require("../../../utils/schemas/admin/setup/basic-settings");
const website_setup_1 = require("../../../constants/website-setup");
const base_controller_1 = __importDefault(require("../base-controller"));
const settings_service_1 = __importDefault(require("../../../services/admin/setup/settings-service"));
const general_service_1 = __importDefault(require("../../../services/admin/general-service"));
const mongoose_1 = __importDefault(require("mongoose"));
const controller = new base_controller_1.default();
class SettingsController extends base_controller_1.default {
    async manageWithCountryId(req, res) {
        try {
            const validatedData = basic_settings_1.settingsFormSchema.safeParse(req.body);
            // console.log('req', (req as any).files);
            const userData = await res.locals.user;
            let countryId = req.params.id || req.body.countryId || (0, helpers_1.getCountryId)(userData);
            if (validatedData.success) {
                if (countryId && typeof countryId === 'string') {
                    countryId = decodeURIComponent(countryId).replace(/[^a-fA-F0-9]/g, '');
                }
                const { languageId, block, blockReference, websiteSetupId, blockValues, status, languageSources, languageValues } = validatedData.data;
                if (((0, helpers_1.checkValueExists)(website_setup_1.websiteSetup, block) && ((0, helpers_1.checkValueExists)(website_setup_1.blockReferences, blockReference)))) {
                    const user = res.locals.user;
                    const newFavIcon = req.files?.filter((file) => file.fieldname && file.fieldname.startsWith('blockValues[favIcon]') && file.fieldname.includes('blockValues[favIcon]'));
                    const newWebsiteLogo = req.files?.filter((file) => file.fieldname && file.fieldname.startsWith('blockValues[websiteLogo]') && file.fieldname.includes('blockValues[websiteLogo]'));
                    if (website_setup_1.blockReferences.basicDetailsSettings === blockReference) {
                        delete blockValues.languageValues;
                    }
                    const settingsData = {
                        countryId: blockReference !== 'global-values' ? new mongoose_1.default.Types.ObjectId(countryId) : null,
                        block,
                        blockReference,
                        blockValues: {
                            ...(website_setup_1.blockReferences.websiteSettings === blockReference ? {
                                primaryColor: blockValues.primaryColor,
                                secondaryColor: blockValues.secondaryColor,
                                websiteLogoUrl: (newWebsiteLogo && newWebsiteLogo.length > 0 ? true : false) ? (0, helpers_1.handleFileUpload)(req, null, newWebsiteLogo[0], 'websiteLogoUrl', 'basicsettings') : blockValues.favIconUrl,
                                favIconUrl: (newFavIcon && newFavIcon.length > 0 ? true : false) ? (0, helpers_1.handleFileUpload)(req, null, newFavIcon[0], 'favIconUrl', 'basicsettings') : blockValues.websiteLogoUrl,
                            } : blockValues)
                        },
                        status: status || '1', // active
                        createdBy: user._id,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };
                    let newBasicSettings = [];
                    if (!languageId) {
                        const websiteSettingResult = await settings_service_1.default.findOne({ countryId: countryId, block: block, blockReference: blockReference });
                        if (!websiteSettingResult) {
                            newBasicSettings = await settings_service_1.default.create(settingsData);
                        }
                        else {
                            newBasicSettings = await settings_service_1.default.update(websiteSettingResult._id, settingsData);
                        }
                    }
                    else {
                        if (websiteSetupId) {
                            if (languageSources && languageValues) {
                                const languageValuesData = await general_service_1.default.multiLanguageFieledsManage(websiteSetupId, {
                                    languageId,
                                    source: languageSources,
                                    sourceId: websiteSetupId,
                                    languageValues: languageValues
                                });
                                if (languageValuesData) {
                                    newBasicSettings = languageValuesData?.languageValues;
                                }
                                else {
                                    return controller.sendErrorResponse(res, 200, {
                                        message: 'Something went wrong on when website setup insertion. Please try again!',
                                    }, req);
                                }
                            }
                            else {
                                return controller.sendErrorResponse(res, 200, {
                                    message: 'language sources is missing',
                                }, req);
                            }
                        }
                        else {
                            return controller.sendErrorResponse(res, 200, {
                                message: 'Please create atleast one main website setup',
                            }, req);
                        }
                    }
                    return controller.sendSuccessResponse(res, {
                        requestedData: newBasicSettings,
                        message: 'Setting created successfully!'
                    }, 200, {
                        sourceFromId: newBasicSettings._id,
                        sourceFrom: task_log_1.adminTaskLog.setup.settings[blockReference],
                        activity: websiteSetupId ? task_log_1.adminTaskLogActivity.update : task_log_1.adminTaskLogActivity.create,
                        activityStatus: task_log_1.adminTaskLogStatus.success
                    });
                }
                else {
                    return controller.sendErrorResponse(res, 500, {
                        message: 'Block values are incorrect',
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
            if (error && error.errors && (error.errors?.blockReference) && (error.errors?.blockReference?.properties)) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        blockReference: error.errors?.blockReference?.properties.message
                    }
                }, req);
            }
            else if (error && error.errors && (error.errors?.block) && (error.errors?.block?.properties)) {
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
    async findOneWithCountryId(req, res) {
        try {
            const countryId = req.params.id;
            if (countryId) {
                const { websiteSetupId, languageId, block, blockReference, languageSources } = req.query;
                if (((0, helpers_1.checkValueExists)(website_setup_1.websiteSetup, block) && ((0, helpers_1.checkValueExists)(website_setup_1.blockReferences, blockReference)))) {
                    const websiteSettingData = await settings_service_1.default.findOne({ countryId, block, blockReference });
                    if (languageId && languageSources && websiteSettingData) {
                        const languageValues = await general_service_1.default.findOneLanguageValues(languageSources, websiteSettingData._id, languageId);
                        console.log('languageValues', languageValues);
                        if (languageValues) {
                            return controller.sendSuccessResponse(res, {
                                requestedData: languageValues.languageValues,
                                message: 'Success'
                            });
                        }
                        else {
                            return controller.sendErrorResponse(res, 200, {
                                message: 'Not found on this language setting item. Please try to add new setting item!',
                            });
                        }
                    }
                    else {
                        return controller.sendSuccessResponse(res, {
                            requestedData: websiteSettingData,
                            message: 'Success'
                        });
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'block and block reference is missing!',
                    });
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Country id with navigation setting not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
}
exports.default = new SettingsController();

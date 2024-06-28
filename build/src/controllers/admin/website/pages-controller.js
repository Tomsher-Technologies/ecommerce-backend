"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const mongoose_1 = __importDefault(require("mongoose"));
const helpers_1 = require("../../../utils/helpers");
const task_log_1 = require("../../../constants/admin/task-log");
const pages_shema_1 = require("../../../utils/schemas/admin/website/pages-shema");
const website_setup_1 = require("../../../constants/website-setup");
const base_controller_1 = __importDefault(require("../base-controller"));
const pages_service_1 = __importDefault(require("../../../services/admin/website/pages-service"));
const general_service_1 = __importDefault(require("../../../services/admin/general-service"));
const multi_language_fieleds_model_1 = __importDefault(require("../../../model/admin/multi-language-fieleds-model"));
const controller = new base_controller_1.default();
class PageController extends base_controller_1.default {
    async manageWithCountryId(req, res) {
        try {
            const validatedData = pages_shema_1.pagesFormSchema.safeParse(req.body);
            // console.log('req', (req as any).files);
            const userData = await res.locals.user;
            let countryId = req.params.id || req.body.countryId || (0, helpers_1.getCountryId)(userData);
            if (validatedData.success) {
                if (countryId && typeof countryId === 'string') {
                    countryId = decodeURIComponent(countryId).replace(/[^a-fA-F0-9]/g, '');
                }
                const { block, blockReference, websiteSetupId, blockValues, status, languageSources, languageValues } = validatedData.data;
                if (((0, helpers_1.checkValueExists)(website_setup_1.websiteSetup, block) && ((0, helpers_1.checkValueExists)(website_setup_1.blockReferences, blockReference)))) {
                    const user = res.locals.user;
                    const aboutImage = req.files.filter((file) => file.fieldname && file.fieldname.startsWith('blockValues[') && file.fieldname.includes('[aboutImage]'));
                    const aboutImage2 = req.files.filter((file) => file.fieldname && file.fieldname.startsWith('blockValues[') && file.fieldname.includes('[aboutImage2]'));
                    const aboutImageUrl = (0, helpers_1.handleFileUpload)(req, null, aboutImage?.length > 0 ? aboutImage[0] : null, 'aboutImageUrl', 'website');
                    const aboutImageUrl2 = (0, helpers_1.handleFileUpload)(req, null, aboutImage2?.length > 0 ? aboutImage2[0] : null, 'aboutImageUrl2', 'website');
                    const pagesData = {
                        countryId: new mongoose_1.default.Types.ObjectId(countryId),
                        block,
                        blockReference,
                        blockValues: {
                            ...blockValues,
                            ...(website_setup_1.blockReferences.aboutUs === blockReference && aboutImageUrl !== null && aboutImageUrl !== '' ? { aboutImageUrl } : {}),
                            ...(website_setup_1.blockReferences.aboutUs === blockReference && aboutImageUrl2 !== null && aboutImageUrl2 !== '' ? { aboutImageUrl2 } : {})
                        },
                        status: status || '1', // active
                        createdBy: user._id,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };
                    let newPagesData = [];
                    const websitePageResult = await pages_service_1.default.findOne({ countryId: countryId, block: block, blockReference: blockReference });
                    if (!websitePageResult) {
                        newPagesData = await pages_service_1.default.create(pagesData);
                    }
                    else {
                        newPagesData = await pages_service_1.default.update(websitePageResult._id, pagesData);
                    }
                    if (newPagesData && languageSources && languageValues && Array.isArray(languageValues) && languageValues.length > 0) {
                        await languageValues.map(async (languageValue, index) => {
                            await general_service_1.default.multiLanguageFieledsManage(newPagesData._id, {
                                ...languageValue,
                                source: languageSources,
                                sourceId: newPagesData._id,
                            });
                        });
                    }
                    return controller.sendSuccessResponse(res, {
                        requestedData: newPagesData,
                        message: 'Language created successfully!'
                    }, 200, {
                        sourceFromId: newPagesData._id,
                        sourceFrom: task_log_1.adminTaskLog.website.pages[blockReference],
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
                const { websiteSetupId, block, blockReference, languageSources } = req.query;
                if (((0, helpers_1.checkValueExists)(website_setup_1.websiteSetup, block) && ((0, helpers_1.checkValueExists)(website_setup_1.blockReferences, blockReference)))) {
                    const websitePageData = await pages_service_1.default.findOne({ countryId, block, blockReference });
                    if (languageSources && websitePageData) {
                        const languageValues = await multi_language_fieleds_model_1.default.find({ source: languageSources, sourceId: websitePageData._id });
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
                    }
                    else {
                        return controller.sendSuccessResponse(res, {
                            requestedData: websitePageData,
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
                    message: 'Country id with navigation page not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
}
exports.default = new PageController();

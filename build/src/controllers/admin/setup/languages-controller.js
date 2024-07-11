"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const helpers_1 = require("../../../utils/helpers");
const language_shema_1 = require("../../../utils/schemas/admin/setup/language-shema");
const task_log_1 = require("../../../constants/admin/task-log");
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const languages_service_1 = __importDefault(require("../../../services/admin/setup/languages-service"));
const controller = new base_controller_1.default();
class LanguagesController extends base_controller_1.default {
    async findAll(req, res) {
        try {
            const { page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '' } = req.query;
            let query = { _id: { $exists: true } };
            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            }
            else {
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
                };
            }
            const sort = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const languages = await languages_service_1.default.findAll({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort
            });
            return controller.sendSuccessResponse(res, {
                requestedData: languages,
                totalCount: await languages_service_1.default.getTotalCount(query),
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching languages' });
        }
    }
    async create(req, res) {
        try {
            const validatedData = language_shema_1.languageSchema.safeParse(req.body);
            // console.log('req', req.file);
            if (validatedData.success) {
                const { languageTitle, slug, languageCode } = validatedData.data;
                const user = res.locals.user;
                const languageData = {
                    languageTitle,
                    slug: slug || (0, helpers_1.slugify)(languageTitle),
                    languageCode,
                    status: '1', // active
                    statusAt: new Date(),
                    createdBy: user._id,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                const newLanguage = await languages_service_1.default.create(languageData);
                return controller.sendSuccessResponse(res, {
                    requestedData: newLanguage,
                    message: 'Language created successfully!'
                }, 200, {
                    sourceFromId: newLanguage._id,
                    sourceFrom: task_log_1.adminTaskLog.setup.languages,
                    activity: task_log_1.adminTaskLogActivity.create,
                    activityStatus: task_log_1.adminTaskLogStatus.success
                });
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                }, req);
            }
        }
        catch (error) {
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
    async findOne(req, res) {
        try {
            const languageId = req.params.id;
            if (languageId) {
                const language = await languages_service_1.default.findOne(languageId);
                return controller.sendSuccessResponse(res, {
                    requestedData: language,
                    message: 'Success'
                });
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Language Id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
    async update(req, res) {
        try {
            const validatedData = language_shema_1.languageSchema.safeParse(req.body);
            if (validatedData.success) {
                const languageId = req.params.id;
                if (languageId) {
                    let updatedLanguageData = req.body;
                    updatedLanguageData = {
                        ...updatedLanguageData,
                        updatedAt: new Date()
                    };
                    const updatedLanguage = await languages_service_1.default.update(languageId, updatedLanguageData);
                    if (updatedLanguage) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedLanguage,
                            message: 'Language updated successfully!'
                        }, 200, {
                            sourceFromId: updatedLanguage._id,
                            sourceFrom: task_log_1.adminTaskLog.setup.languages,
                            activity: task_log_1.adminTaskLogActivity.update,
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Language Id not found!',
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Language Id not found! Please try again with language id',
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
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating language'
            }, req);
        }
    }
    async statusChange(req, res) {
        try {
            const validatedData = language_shema_1.languageStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const language = req.params.id;
                if (language) {
                    let { status } = req.body;
                    const updatedLanguageData = { status };
                    const updatedLanguage = await languages_service_1.default.update(language, updatedLanguageData);
                    if (updatedLanguage) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedLanguage,
                            message: 'Language status updated successfully!'
                        }, 200, {
                            sourceFromId: updatedLanguage._id,
                            sourceFrom: task_log_1.adminTaskLog.setup.languages,
                            activity: task_log_1.adminTaskLogActivity.statusChange,
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Language Id not found!',
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Language Id not found! Please try again with language id',
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
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating language'
            }, req);
        }
    }
    async destroy(req, res) {
        try {
            const languageId = req.params.id;
            if (languageId) {
                const language = await languages_service_1.default.findOne(languageId);
                if (language) {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'You cant delete this language!',
                    });
                    // await LanguagesService.destroy(languageId);
                    // controller.sendSuccessResponse(res, { message: 'Language deleted successfully!' });
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'This language details not found!',
                    });
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Language id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting language' });
        }
    }
}
exports.default = new LanguagesController();

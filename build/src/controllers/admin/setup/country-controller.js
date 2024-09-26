"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const helpers_1 = require("../../../utils/helpers");
const country_schema_1 = require("../../../utils/schemas/admin/setup/country-schema");
const task_log_1 = require("../../../constants/admin/task-log");
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const country_service_1 = __importDefault(require("../../../services/admin/setup/country-service"));
const collections_1 = require("../../../constants/collections");
const controller = new base_controller_1.default();
class CountryController extends base_controller_1.default {
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
                        { countryTitle: keywordRegex },
                        { countryCode: keywordRegex },
                        { currencyCode: keywordRegex },
                        { countryShortTitle: keywordRegex },
                        { countrySubDomain: keywordRegex }
                    ],
                    ...query
                };
            }
            const sort = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const countries = await country_service_1.default.findAll({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort
            });
            controller.sendSuccessResponse(res, {
                requestedData: countries,
                totalCount: await country_service_1.default.getTotalCount(query),
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching countries' });
        }
    }
    async create(req, res) {
        try {
            const validatedData = country_schema_1.countrySchema.safeParse(req.body);
            // console.log('req', req.file);
            if (validatedData.success) {
                const { countryTitle, slug, countryCode, currencyCode, isOrigin, countryShortTitle, countrySubDomain } = validatedData.data;
                const user = res.locals.user;
                const countryData = {
                    countryTitle,
                    slug: slug || (0, helpers_1.slugify)(countryTitle),
                    countryImageUrl: (0, helpers_1.handleFileUpload)(req, null, req.file, 'countryImageUrl', 'country'),
                    countryCode,
                    currencyCode,
                    countryShortTitle,
                    countrySubDomain,
                    isOrigin: Boolean(isOrigin),
                    status: '1', // active
                    statusAt: new Date(),
                    createdBy: user._id,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                const newCountry = await country_service_1.default.create(countryData);
                return controller.sendSuccessResponse(res, {
                    requestedData: newCountry,
                    message: 'Country created successfully!'
                }, 200, {
                    userId: user._id,
                    countryId: user.countryId,
                    sourceCollection: collections_1.collections.setup.countries,
                    referenceData: JSON.stringify({
                        countryTitle: newCountry.countryTitle,
                        slug: newCountry.slug,
                        countryCode: newCountry.countryCode,
                        currencyCode: newCountry.currencyCode,
                    }, null, 2),
                    sourceFromId: newCountry._id,
                    sourceFrom: task_log_1.adminTaskLog.setup.country,
                    activity: task_log_1.adminTaskLogActivity.create,
                    activityComment: 'Country created successfully!',
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
            if (error && error.errors) {
                let validationError = '';
                if (error.errors.countryTitle && error.errors.countryTitle.properties) {
                    validationError = {
                        message: 'Validation error',
                        validation: {
                            countryTitle: error.errors.countryTitle.properties.message
                        }
                    };
                }
                else if (error.errors.countryCode && error.errors.countryCode.properties) {
                    validationError = {
                        message: 'Validation error',
                        validation: {
                            countryCode: error.errors.countryCode.properties.message
                        }
                    };
                }
                if (error.errors.currencyCode && error.errors.currencyCode.properties) {
                    validationError = {
                        message: 'Validation error',
                        validation: {
                            currencyCode: error.errors.currencyCode.properties.message
                        }
                    };
                }
                if (error.errors.countryShortTitle && error.errors.countryShortTitle.properties) {
                    validationError = {
                        message: 'Validation error',
                        validation: {
                            countryShortTitle: error.errors.countryShortTitle.properties.message
                        }
                    };
                }
                if (error.errors.countrySubDomain && error.errors.countrySubDomain.properties) {
                    validationError = {
                        message: 'Validation error',
                        validation: {
                            countrySubDomain: error.errors.countrySubDomain.properties.message
                        }
                    };
                }
                return controller.sendErrorResponse(res, 200, validationError, req);
            }
            else {
                controller.sendErrorResponse(res, 500, {
                    message: error.message || 'Some error occurred while updating country'
                }, req);
            }
        }
    }
    async findOne(req, res) {
        try {
            const countryId = req.params.id;
            if (countryId) {
                const country = await country_service_1.default.findOne(countryId);
                controller.sendSuccessResponse(res, {
                    requestedData: country,
                    message: 'Success'
                });
            }
            else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Country Id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
    async update(req, res) {
        try {
            const validatedData = country_schema_1.countrySchema.safeParse(req.body);
            if (validatedData.success) {
                const countryId = req.params.id;
                if (countryId) {
                    let updatedCountryData = req.body;
                    updatedCountryData = {
                        ...updatedCountryData,
                        countryImageUrl: (0, helpers_1.handleFileUpload)(req, await country_service_1.default.findOne(countryId), req.file, 'countryImageUrl', 'country'),
                        updatedAt: new Date()
                    };
                    const updatedCountry = await country_service_1.default.update(countryId, updatedCountryData);
                    if (updatedCountry) {
                        const user = res.locals.user;
                        controller.sendSuccessResponse(res, {
                            requestedData: updatedCountry,
                            message: 'Country updated successfully!'
                        }, 200, {
                            userId: user._id,
                            countryId: user.countryId,
                            sourceCollection: collections_1.collections.setup.countries,
                            referenceData: JSON.stringify(updatedCountry, null, 2),
                            sourceFromId: updatedCountry._id,
                            sourceFrom: task_log_1.adminTaskLog.setup.country,
                            activity: task_log_1.adminTaskLogActivity.update,
                            activityComment: 'Country updated successfully!',
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        controller.sendErrorResponse(res, 200, {
                            message: 'Country Id not found!',
                        }, req);
                    }
                }
                else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Country Id not found! Please try again with country id',
                    }, req);
                }
            }
            else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                }, req);
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            if (error && error.errors) {
                let validationError = '';
                if (error.errors.countryTitle && error.errors.countryTitle.properties) {
                    validationError = {
                        message: 'Validation error',
                        validation: {
                            countryTitle: error.errors.countryTitle.properties.message
                        }
                    };
                }
                else if (error.errors.countryCode && error.errors.countryCode.properties) {
                    validationError = {
                        message: 'Validation error',
                        validation: {
                            countryCode: error.errors.countryCode.properties.message
                        }
                    };
                }
                if (error.errors.currencyCode && error.errors.currencyCode.properties) {
                    validationError = {
                        message: 'Validation error',
                        validation: {
                            currencyCode: error.errors.currencyCode.properties.message
                        }
                    };
                }
                if (error.errors.countryShortTitle && error.errors.countryShortTitle.properties) {
                    validationError = {
                        message: 'Validation error',
                        validation: {
                            countryShortTitle: error.errors.countryShortTitle.properties.message
                        }
                    };
                }
                if (error.errors.countrySubDomain && error.errors.countrySubDomain.properties) {
                    validationError = {
                        message: 'Validation error',
                        validation: {
                            countrySubDomain: error.errors.countrySubDomain.properties.message
                        }
                    };
                }
                return controller.sendErrorResponse(res, 200, validationError, req);
            }
            else {
                controller.sendErrorResponse(res, 500, {
                    message: error.message || 'Some error occurred while updating country'
                }, req);
            }
        }
    }
    async statusChange(req, res) {
        try {
            const validatedData = country_schema_1.countryStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const countryId = req.params.id;
                if (countryId) {
                    let { status } = req.body;
                    const updatedCountryData = { status };
                    const updatedCountry = await country_service_1.default.update(countryId, updatedCountryData);
                    if (updatedCountry) {
                        const user = res.locals.user;
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedCountry,
                            message: 'Country status updated successfully!'
                        }, 200, {
                            userId: user._id,
                            countryId: user.countryId,
                            sourceCollection: collections_1.collections.setup.countries,
                            referenceData: JSON.stringify({
                                countryTitle: updatedCountry.countryTitle,
                                slug: updatedCountry.slug,
                                countryCode: updatedCountry.countryCode,
                                currencyCode: updatedCountry.currencyCode,
                            }, null, 2),
                            sourceFromId: updatedCountry._id,
                            sourceFrom: task_log_1.adminTaskLog.setup.country,
                            activityComment: 'Country status updated successfully!',
                            activity: task_log_1.adminTaskLogActivity.statusChange,
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Country Id not found!',
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Country Id not found! Please try again with country id',
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
                message: error.message || 'Some error occurred while updating brand'
            }, req);
        }
    }
    async destroy(req, res) {
        try {
            const countryId = req.params.id;
            if (countryId) {
                const country = await country_service_1.default.findOne(countryId);
                if (country) {
                    // await CountryService.destroy(countryId);
                    // controller.sendSuccessResponse(res, { message: 'Country deleted successfully!' });
                    controller.sendErrorResponse(res, 200, {
                        message: 'You cant delete this country!',
                    });
                }
                else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'This Country details not found!',
                    });
                }
            }
            else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Country id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting country' });
        }
    }
}
exports.default = new CountryController();

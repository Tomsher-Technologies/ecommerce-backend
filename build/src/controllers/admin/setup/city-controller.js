"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const mongoose_1 = require("mongoose");
const helpers_1 = require("../../../utils/helpers");
const city_schema_1 = require("../../../utils/schemas/admin/setup/city-schema");
const task_log_1 = require("../../../constants/admin/task-log");
const base_controller_1 = __importDefault(require("../base-controller"));
const city_service_1 = __importDefault(require("../../../services/admin/setup/city-service"));
const controller = new base_controller_1.default();
class CityController extends base_controller_1.default {
    async findAllCity(req, res) {
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
                        { cityTitle: keywordRegex },
                    ],
                    ...query
                };
            }
            const sort = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const cities = await city_service_1.default.findAllCity({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort
            });
            controller.sendSuccessResponse(res, {
                requestedData: cities,
                totalCount: await city_service_1.default.getCityTotalCount(query),
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching cities' });
        }
    }
    async createCity(req, res) {
        try {
            const validatedData = city_schema_1.citySchema.safeParse(req.body);
            if (validatedData.success) {
                const { countryId, stateId, cityTitle, slug, } = validatedData.data;
                const user = res.locals.user;
                const cityData = {
                    countryId: new mongoose_1.Schema.Types.ObjectId(countryId),
                    stateId: new mongoose_1.Schema.Types.ObjectId(stateId),
                    cityTitle,
                    slug: slug || (0, helpers_1.slugify)(cityTitle),
                    status: '1', // active
                    statusAt: new Date(),
                    createdBy: user._id,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                const newCity = await city_service_1.default.creatCitye(cityData);
                return controller.sendSuccessResponse(res, {
                    requestedData: newCity,
                    message: 'City created successfully!'
                }, 200, {
                    sourceFromId: newCity._id,
                    sourceFrom: task_log_1.adminTaskLog.setup.city,
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
            if (error && error.errors) {
                let validationError = '';
                if (error.errors.cityTitle && error.errors.cityTitle.properties) {
                    validationError = {
                        message: 'Validation error',
                        validation: {
                            cityTitle: error.errors.cityTitle.properties.message
                        }
                    };
                }
                return controller.sendErrorResponse(res, 200, validationError, req);
            }
            else {
                controller.sendErrorResponse(res, 500, {
                    message: error.message || 'Some error occurred while updating city'
                }, req);
            }
        }
    }
    async findOneCity(req, res) {
        try {
            const cityId = req.params.id;
            if (cityId) {
                const city = await city_service_1.default.findOneCity(cityId);
                controller.sendSuccessResponse(res, {
                    requestedData: city,
                    message: 'Success'
                });
            }
            else {
                controller.sendErrorResponse(res, 200, {
                    message: 'City Id not found!',
                });
            }
        }
        catch (error) {
            controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
    async updateCity(req, res) {
        try {
            const validatedData = city_schema_1.citySchema.safeParse(req.body);
            if (validatedData.success) {
                const cityId = req.params.id;
                if (cityId) {
                    let updatedCityData = req.body;
                    updatedCityData = {
                        ...updatedCityData,
                        updatedAt: new Date()
                    };
                    const updatedCity = await city_service_1.default.updateCity(cityId, updatedCityData);
                    if (updatedCity) {
                        controller.sendSuccessResponse(res, {
                            requestedData: updatedCity,
                            message: 'City updated successfully!'
                        }, 200, {
                            sourceFromId: updatedCity._id,
                            sourceFrom: task_log_1.adminTaskLog.setup.city,
                            activity: task_log_1.adminTaskLogActivity.update,
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        controller.sendErrorResponse(res, 200, {
                            message: 'City Id not found!',
                        }, req);
                    }
                }
                else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'City Id not found! Please try again with city id',
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
        catch (error) {
            if (error && error.errors) {
                let validationError = '';
                if (error.errors.cityTitle && error.errors.cityTitle.properties) {
                    validationError = {
                        message: 'Validation error',
                        validation: {
                            cityTitle: error.errors.cityTitle.properties.message
                        }
                    };
                }
                return controller.sendErrorResponse(res, 200, validationError, req);
            }
            else {
                controller.sendErrorResponse(res, 500, {
                    message: error.message || 'Some error occurred while updating city'
                }, req);
            }
        }
    }
    async statusChange(req, res) {
        try {
            const validatedData = city_schema_1.cityStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const cityId = req.params.id;
                if (cityId) {
                    let { status } = req.body;
                    const updatedCityData = { status };
                    const updatedCity = await city_service_1.default.updateCity(cityId, updatedCityData);
                    if (updatedCity) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedCity,
                            message: 'City status updated successfully!'
                        }, 200, {
                            sourceFromId: updatedCity._id,
                            sourceFrom: task_log_1.adminTaskLog.setup.city,
                            activity: task_log_1.adminTaskLogActivity.statusChange,
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'City Id not found!',
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'City Id not found! Please try again with city id',
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
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating brand'
            }, req);
        }
    }
    async destroy(req, res) {
        try {
            const cityId = req.params.id;
            if (cityId) {
                const city = await city_service_1.default.findOneCity(cityId);
                if (city) {
                    controller.sendErrorResponse(res, 200, {
                        message: 'You cant delete this city!',
                    });
                }
                else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'This City details not found!',
                    });
                }
            }
            else {
                controller.sendErrorResponse(res, 200, {
                    message: 'City id not found!',
                });
            }
        }
        catch (error) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting city' });
        }
    }
}
exports.default = new CityController();

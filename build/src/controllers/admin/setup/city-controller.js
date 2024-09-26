"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const mongoose_1 = __importStar(require("mongoose"));
const helpers_1 = require("../../../utils/helpers");
const city_schema_1 = require("../../../utils/schemas/admin/setup/city-schema");
const task_log_1 = require("../../../constants/admin/task-log");
const base_controller_1 = __importDefault(require("../base-controller"));
const city_service_1 = __importDefault(require("../../../services/admin/setup/city-service"));
const collections_1 = require("../../../constants/collections");
const controller = new base_controller_1.default();
class CityController extends base_controller_1.default {
    async findAllCity(req, res) {
        try {
            const { countryId = '', stateId = '', page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '' } = req.query;
            let query = { _id: { $exists: true } };
            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            }
            else {
                query.status = '1';
            }
            if (countryId) {
                query.countryId = new mongoose_1.default.Types.ObjectId(countryId);
            }
            if (stateId) {
                query.stateId = new mongoose_1.default.Types.ObjectId(stateId);
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
            return controller.sendSuccessResponse(res, {
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
                    countryId,
                    stateId,
                    cityTitle,
                    slug: slug || (0, helpers_1.slugify)(cityTitle),
                    status: '1', // active
                    statusAt: new Date(),
                    createdBy: user._id,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                const newCity = await city_service_1.default.creatCitye(cityData);
                if (newCity) {
                    return controller.sendSuccessResponse(res, {
                        requestedData: newCity,
                        message: 'City created successfully!'
                    }, 200, {
                        userId: user._id,
                        countryId: user.countryId,
                        sourceCollection: collections_1.collections.setup.cities,
                        referenceData: JSON.stringify(newCity, null, 2),
                        sourceFromId: newCity._id,
                        sourceFrom: task_log_1.adminTaskLog.setup.city,
                        activity: task_log_1.adminTaskLogActivity.create,
                        activityComment: 'City created successfully!',
                        activityStatus: task_log_1.adminTaskLogStatus.success
                    });
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Something went wrong, please try again!',
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
                return controller.sendErrorResponse(res, 200, {
                    message: 'City Id not found!',
                });
            }
        }
        catch (error) {
            controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
    async findOneCityFromState(req, res) {
        try {
            const stateId = req.params.id;
            if (stateId) {
                const city = await city_service_1.default.findOneCity({ stateId: new mongoose_1.Schema.Types.ObjectId(stateId) });
                return controller.sendSuccessResponse(res, {
                    requestedData: city,
                    message: 'Success'
                });
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'State Id not found!',
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
                        const user = res.locals.user;
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedCity,
                            message: 'City updated successfully!'
                        }, 200, {
                            userId: user._id,
                            countryId: user.countryId,
                            sourceCollection: collections_1.collections.setup.cities,
                            referenceData: JSON.stringify(updatedCity, null, 2),
                            sourceFromId: updatedCity._id,
                            sourceFrom: task_log_1.adminTaskLog.setup.city,
                            activity: task_log_1.adminTaskLogActivity.update,
                            activityComment: 'City updated successfully!',
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
                    controller.sendErrorResponse(res, 200, {
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
                return controller.sendErrorResponse(res, 500, {
                    message: error.message || 'Some error occurred while updating city'
                }, req);
            }
        }
    }
    async statusChangeCity(req, res) {
        try {
            const validatedData = city_schema_1.cityStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const cityId = req.params.id;
                if (cityId) {
                    let { status } = req.body;
                    const updatedCityData = { status };
                    const updatedCity = await city_service_1.default.updateCity(cityId, updatedCityData);
                    if (updatedCity) {
                        const user = res.locals.user;
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedCity,
                            message: 'City status updated successfully!'
                        }, 200, {
                            userId: user._id,
                            countryId: user.countryId,
                            sourceCollection: collections_1.collections.setup.cities,
                            referenceData: JSON.stringify(updatedCity, null, 2),
                            sourceFromId: updatedCity._id,
                            sourceFrom: task_log_1.adminTaskLog.setup.city,
                            activity: task_log_1.adminTaskLogActivity.statusChange,
                            activityComment: 'City status updated successfully!',
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
                    return controller.sendErrorResponse(res, 200, {
                        message: 'You cant delete this city!',
                    });
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'This City details not found!',
                    });
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'City id not found!',
                });
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting city' });
        }
    }
}
exports.default = new CityController();

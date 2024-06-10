"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const helpers_1 = require("../../../utils/helpers");
const slider_schema_1 = require("../../../utils/schemas/admin/ecommerce/slider-schema");
const task_log_1 = require("../../../constants/admin/task-log");
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const slider_service_1 = __importDefault(require("../../../services/admin/ecommerce/slider-service"));
const general_service_1 = __importDefault(require("../../../services/admin/general-service"));
const slider_model_1 = __importDefault(require("../../../model/admin/ecommerce/slider-model"));
const multi_languages_1 = require("../../../constants/multi-languages");
const controller = new base_controller_1.default();
class SlidersController extends base_controller_1.default {
    async findAll(req, res) {
        try {
            const { page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '', page = '', pageReference = '' } = req.query;
            let query = { _id: { $exists: true } };
            const userData = await res.locals.user;
            const countryId = (0, helpers_1.getCountryId)(userData);
            if (countryId) {
                query.countryId = countryId;
            }
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
                        { sliderTitle: keywordRegex }
                    ],
                    ...query
                };
            }
            if (page) {
                query = {
                    ...query, page: page
                };
            }
            if (pageReference) {
                query = {
                    ...query, pageReference: pageReference
                };
            }
            const sort = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const sliders = await slider_service_1.default.findAll({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort
            });
            return controller.sendSuccessResponse(res, {
                requestedData: sliders,
                totalCount: await slider_service_1.default.getTotalCount(query),
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching sliders' });
        }
    }
    async create(req, res) {
        try {
            const validatedData = slider_schema_1.sliderSchema.safeParse(req.body);
            if (validatedData.success) {
                const { countryId, sliderTitle, slug, page, linkType, link, position, description, status, languageValues, pageReference } = validatedData.data;
                const user = res.locals.user;
                const sliderImage = req.files.find((file) => file.fieldname === 'sliderImage');
                const sliderData = {
                    countryId: countryId || (0, helpers_1.getCountryId)(user),
                    sliderTitle,
                    slug: slug || (0, helpers_1.slugify)(sliderTitle),
                    page,
                    pageReference,
                    linkType,
                    link,
                    position,
                    sliderImageUrl: (0, helpers_1.handleFileUpload)(req, null, (req.file || sliderImage), 'sliderImageUrl', 'slider'),
                    description,
                    status: status || '1',
                    createdBy: user._id,
                    createdAt: new Date()
                };
                const newSlider = await slider_service_1.default.create(sliderData);
                if (newSlider) {
                    const languageValuesImages = req.files.filter((file) => file.fieldname &&
                        file.fieldname.startsWith('languageValues[') &&
                        file.fieldname.includes('[sliderImage]'));
                    if (languageValues && Array.isArray(languageValues) && languageValues.length > 0) {
                        await languageValues?.map((languageValue, index) => {
                            let sliderImageUrl = '';
                            if (languageValuesImages.length > 0) {
                                sliderImageUrl = (0, helpers_1.handleFileUpload)(req, null, languageValuesImages[index], `sliderImageUrl`, 'slider');
                            }
                            general_service_1.default.multiLanguageFieledsManage(newSlider._id, {
                                ...languageValue,
                                languageValues: {
                                    ...languageValue.languageValues,
                                    sliderImageUrl
                                }
                            });
                        });
                    }
                    return controller.sendSuccessResponse(res, {
                        requestedData: newSlider,
                        message: 'Slider created successfully!'
                    });
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Error',
                        validation: 'Something went wrong! slider cant be inserted. please try again'
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
            if (error && error.errors && error.errors.sliderTitle && error.errors.sliderTitle.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        sliderTitle: error.errors.sliderTitle.properties.message
                    }
                }, req);
            }
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating Slider',
            }, req);
        }
    }
    async findOne(req, res) {
        try {
            const sliderId = req.params.id;
            if (sliderId) {
                const slider = await slider_service_1.default.findOne(sliderId);
                return controller.sendSuccessResponse(res, {
                    requestedData: slider,
                    message: 'Success'
                });
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Slider Id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
    async update(req, res) {
        try {
            const validatedData = slider_schema_1.sliderSchema.safeParse(req.body);
            if (validatedData.success) {
                const sliderId = req.params.id;
                if (sliderId) {
                    const sliderImage = req.files.find((file) => file.fieldname === 'sliderImage');
                    let updatedSliderData = req.body;
                    updatedSliderData = {
                        ...updatedSliderData,
                        sliderImageUrl: (0, helpers_1.handleFileUpload)(req, await slider_service_1.default.findOne(sliderId), (req.file || sliderImage), 'sliderImageUrl', 'slider'),
                        updatedAt: new Date()
                    };
                    const updatedSlider = await slider_service_1.default.update(sliderId, updatedSliderData);
                    if (updatedSlider) {
                        const languageValuesImages = req.files.filter((file) => file.fieldname &&
                            file.fieldname.startsWith('languageValues[') &&
                            file.fieldname.includes('[sliderImage]'));
                        let newLanguageValues = [];
                        if (updatedSliderData.languageValues && Array.isArray(updatedSliderData.languageValues) && updatedSliderData.languageValues.length > 0) {
                            for (let i = 0; i < updatedSliderData.languageValues.length; i++) {
                                const languageValue = updatedSliderData.languageValues[i];
                                let sliderImageUrl = '';
                                const matchingImage = languageValuesImages.find((image) => image.fieldname.includes(`languageValues[${i}]`));
                                if (languageValuesImages.length > 0 && matchingImage) {
                                    const existingLanguageValues = await general_service_1.default.findOneLanguageValues(multi_languages_1.multiLanguageSources.ecommerce.sliders, updatedSlider._id, languageValue.languageId);
                                    sliderImageUrl = await (0, helpers_1.handleFileUpload)(req, existingLanguageValues.languageValues, matchingImage, `sliderImageUrl`, 'slider');
                                }
                                else {
                                    sliderImageUrl = updatedSliderData.languageValues[i].languageValues?.sliderImageUrl;
                                }
                                const languageValues = await general_service_1.default.multiLanguageFieledsManage(updatedSlider._id, {
                                    ...languageValue,
                                    languageValues: {
                                        ...languageValue.languageValues,
                                        sliderImageUrl
                                    }
                                });
                                newLanguageValues.push(languageValues);
                            }
                        }
                        const updatedSliderMapped = Object.keys(updatedSlider).reduce((mapped, key) => {
                            mapped[key] = updatedSlider[key];
                            return mapped;
                        }, {});
                        return controller.sendSuccessResponse(res, {
                            requestedData: {
                                ...updatedSliderMapped,
                                languageValues: newLanguageValues
                            },
                            message: 'Slider updated successfully!'
                        }, 200, {
                            sourceFromId: updatedSliderMapped._id,
                            sourceFrom: task_log_1.adminTaskLog.ecommerce.sliders,
                            activity: task_log_1.adminTaskLogActivity.update,
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Slider Id not found!',
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Slider Id not found! Please try again with slider id',
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
                message: error.message || 'Some error occurred while updating slider'
            }, req);
        }
    }
    async statusChange(req, res) {
        try {
            const validatedData = slider_schema_1.sliderStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const sliderId = req.params.id;
                if (sliderId) {
                    let { status } = req.body;
                    const updatedSliderData = { status };
                    const updatedSlider = await slider_service_1.default.update(sliderId, updatedSliderData);
                    if (updatedSlider) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedSlider,
                            message: 'Slider status updated successfully!'
                        }, 200, {
                            sourceFromId: sliderId,
                            sourceFrom: task_log_1.adminTaskLog.ecommerce.sliders,
                            activity: task_log_1.adminTaskLogActivity.statusChange,
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Slider Id not found!',
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Slider Id not found! Please try again with slider id',
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
                message: error.message || 'Some error occurred while updating slider'
            }, req);
        }
    }
    async positionChange(req, res) {
        try {
            const validatedData = slider_schema_1.sliderPositionSchema.safeParse(req.body);
            if (validatedData.success) {
                const sliderId = req.params.id;
                if (sliderId) {
                    let { position } = req.body;
                    const updatedSlider = await general_service_1.default.changePosition(slider_model_1.default, sliderId, position);
                    if (updatedSlider) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedSlider,
                            message: 'Slider status updated successfully!'
                        }, 200, {
                            sourceFromId: sliderId,
                            sourceFrom: task_log_1.adminTaskLog.ecommerce.sliders,
                            activity: task_log_1.adminTaskLogActivity.positionChange,
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Slider Id not found!',
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Slider Id not found! Please try again with slider id',
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
                message: error.message || 'Some error occurred while updating slider'
            }, req);
        }
    }
    async destroy(req, res) {
        try {
            const sliderId = req.params.id;
            if (sliderId) {
                const slider = await slider_service_1.default.findOne(sliderId);
                if (slider) {
                    const SliderServices = await slider_service_1.default.destroy(sliderId);
                    const existingLanguageValues = await general_service_1.default.findOneLanguageValues(multi_languages_1.multiLanguageSources.ecommerce.sliders, sliderId);
                    if (existingLanguageValues) {
                        await general_service_1.default.destroyLanguageValues(existingLanguageValues._id);
                    }
                    return controller.sendSuccessResponse(res, { message: 'Slider deleted successfully!' }, 200, {
                        sourceFromId: sliderId,
                        sourceFrom: task_log_1.adminTaskLog.ecommerce.sliders,
                        activity: task_log_1.adminTaskLogActivity.delete,
                        activityStatus: task_log_1.adminTaskLogStatus.success
                    });
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'This slider details not found!',
                    });
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Slider id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting slider' });
        }
    }
}
exports.default = new SlidersController();

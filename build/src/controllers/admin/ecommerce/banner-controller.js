"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const helpers_1 = require("../../../utils/helpers");
const banner_schema_1 = require("../../../utils/schemas/admin/ecommerce/banner-schema");
const multi_languages_1 = require("../../../constants/multi-languages");
const task_log_1 = require("../../../constants/admin/task-log");
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const banner_service_1 = __importDefault(require("../../../services/admin/ecommerce/banner-service"));
const general_service_1 = __importDefault(require("../../../services/admin/general-service"));
const banner_model_1 = __importDefault(require("../../../model/admin/ecommerce/banner-model"));
const controller = new base_controller_1.default();
class BannerController extends base_controller_1.default {
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
                        { bannerTitle: keywordRegex },
                        { page: keywordRegex },
                        { pageReference: keywordRegex },
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
            const banners = await banner_service_1.default.findAll({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort
            });
            return controller.sendSuccessResponse(res, {
                requestedData: banners,
                totalCount: await banner_service_1.default.getTotalCount(query),
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching banners' });
        }
    }
    async create(req, res) {
        try {
            const validatedData = banner_schema_1.bannerSchema.safeParse(req.body);
            // console.log('req', req.file);
            if (validatedData.success) {
                const { countryId, bannerTitle, bannerSubTitle, slug, page, linkType, link, position, description, blocks, languageValues, status, pageReference } = validatedData.data;
                const user = res.locals.user;
                const mewBannerImages = req.files.filter((file) => file.fieldname &&
                    file.fieldname.startsWith('bannerImages[') &&
                    file.fieldname.includes('[bannerImage]'));
                if (mewBannerImages?.length > 0) {
                    let bannerImages = [];
                    bannerImages = await banner_service_1.default.setBannerBlocksImages(req, mewBannerImages);
                    const bannerData = {
                        countryId: countryId || (0, helpers_1.getCountryId)(user),
                        bannerTitle,
                        bannerSubTitle,
                        slug: slug || (0, helpers_1.slugify)(bannerTitle),
                        page,
                        pageReference,
                        linkType,
                        link,
                        position,
                        blocks,
                        bannerImages: bannerImages,
                        bannerImagesUrl: (0, helpers_1.handleFileUpload)(req, null, (mewBannerImages), 'bannerImagesUrl', 'banner'),
                        description,
                        status: status || '1',
                        createdBy: user._id,
                        createdAt: new Date()
                    };
                    const newBanner = await banner_service_1.default.create(bannerData);
                    if (newBanner) {
                        if (languageValues && Array.isArray(languageValues) && languageValues.length > 0) {
                            const languageValuesImages = req.files.filter((file) => file.fieldname &&
                                file.fieldname.startsWith('languageValues[') &&
                                file.fieldname.includes('[bannerImage]'));
                            await languageValues.map(async (languageValue, index) => {
                                const matchingImage = languageValuesImages.filter((image) => image.fieldname.includes(`languageValues[${index}]`));
                                let languageBannerImages = [];
                                if (Array.isArray(matchingImage) && matchingImage?.length > 0) {
                                    languageBannerImages = await banner_service_1.default.setBannerBlocksImages(req, matchingImage);
                                }
                                general_service_1.default.multiLanguageFieledsManage(newBanner._id, {
                                    ...languageValue,
                                    languageValues: {
                                        ...languageValue.languageValues,
                                        bannerImages: languageBannerImages
                                    }
                                });
                            });
                        }
                        return controller.sendSuccessResponse(res, {
                            requestedData: newBanner,
                            message: 'Banner created successfully!'
                        }, 200, {
                            sourceFromId: newBanner._id,
                            sourceFrom: task_log_1.adminTaskLog.ecommerce.banner,
                            activity: task_log_1.adminTaskLogActivity.create,
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Error',
                            validation: 'Something went wrong! banner cant be inserted. please try again'
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                        validation: "Banner image is required"
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
            if (error && error.errors && error.errors.bannerTitle && error.errors.bannerTitle.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        bannerTitle: error.errors.bannerTitle.properties.message
                    }
                }, req);
            }
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating Banner',
            }, req);
        }
    }
    async findOne(req, res) {
        try {
            const bannerId = req.params.id;
            if (bannerId) {
                const banner = await banner_service_1.default.findOne(bannerId);
                return controller.sendSuccessResponse(res, {
                    requestedData: banner,
                    message: 'Success'
                });
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Banner Id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
    async update(req, res) {
        try {
            const validatedData = banner_schema_1.bannerSchema.safeParse(req.body);
            if (validatedData.success) {
                const bannerId = req.params.id;
                if (bannerId) {
                    const mewBannerImages = req.files.filter((file) => file.fieldname &&
                        file.fieldname.startsWith('bannerImages[') &&
                        file.fieldname.includes('[bannerImage]'));
                    let bannerImages = [];
                    bannerImages = await banner_service_1.default.setBannerBlocksImages(req, mewBannerImages, req.body.bannerImages);
                    let updatedBannerData = req.body;
                    updatedBannerData = {
                        ...updatedBannerData,
                        bannerImages: bannerImages,
                        updatedAt: new Date()
                    };
                    const updatedBanner = await banner_service_1.default.update(bannerId, updatedBannerData);
                    if (updatedBanner) {
                        let newLanguageValues = [];
                        if (updatedBannerData.languageValues && Array.isArray(updatedBannerData.languageValues) && updatedBannerData.languageValues.length > 0) {
                            const languageValuesImages = req.files.filter((file) => file.fieldname &&
                                file.fieldname.startsWith('languageValues[') &&
                                file.fieldname.includes('[bannerImage]'));
                            for (let i = 0; i < updatedBannerData.languageValues.length; i++) {
                                const languageValue = updatedBannerData.languageValues[i];
                                const existingLanguageValues = await general_service_1.default.findOneLanguageValues(multi_languages_1.multiLanguageSources.ecommerce.banner, updatedBanner._id, languageValue.languageId);
                                const matchingImage = languageValuesImages.filter((image) => image.fieldname.includes(`languageValues[${i}]`));
                                let languageBannerImages = existingLanguageValues.languageValues?.bannerImages;
                                if (languageValuesImages.length > 0 && matchingImage) {
                                    languageBannerImages = await banner_service_1.default.setBannerBlocksImages(req, matchingImage, languageBannerImages);
                                }
                                const languageValues = await general_service_1.default.multiLanguageFieledsManage(updatedBanner._id, {
                                    ...languageValue,
                                    languageValues: {
                                        ...languageValue.languageValues,
                                        bannerImages: languageBannerImages
                                    }
                                });
                                newLanguageValues.push(languageValues);
                            }
                        }
                        const updatedBannerMapped = Object.keys(updatedBanner).reduce((mapped, key) => {
                            mapped[key] = updatedBanner[key];
                            return mapped;
                        }, {});
                        return controller.sendSuccessResponse(res, {
                            requestedData: {
                                ...updatedBannerMapped,
                                languageValues: newLanguageValues
                            },
                            message: 'Banner updated successfully!'
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Banner Id not found!',
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Banner Id not found! Please try again with banner id',
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
                message: error.message || 'Some error occurred while updating banner'
            }, req);
        }
    }
    async statusChange(req, res) {
        try {
            const validatedData = banner_schema_1.bannerStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const bannerId = req.params.id;
                if (bannerId) {
                    let { status } = req.body;
                    const updatedBannerData = { status };
                    const updatedBanner = await banner_service_1.default.update(bannerId, updatedBannerData);
                    if (updatedBanner) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedBanner,
                            message: 'Banner status updated successfully!'
                        }, 200, {
                            sourceFromId: updatedBanner._id,
                            sourceFrom: task_log_1.adminTaskLog.ecommerce.banner,
                            activity: task_log_1.adminTaskLogActivity.statusChange,
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Banner Id not found!',
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Banner Id not found! Please try again with banner id',
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
                message: error.message || 'Some error occurred while updating banner'
            }, req);
        }
    }
    async positionChange(req, res) {
        try {
            const validatedData = banner_schema_1.bannerPositionSchema.safeParse(req.body);
            if (validatedData.success) {
                const bannerId = req.params.id;
                if (bannerId) {
                    let { position } = req.body;
                    const updatedBanner = await general_service_1.default.changePosition(banner_model_1.default, bannerId, position);
                    if (updatedBanner) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedBanner,
                            message: 'Banner status updated successfully!'
                        }, 200, {
                            sourceFromId: updatedBanner._id,
                            sourceFrom: task_log_1.adminTaskLog.ecommerce.banner,
                            activity: task_log_1.adminTaskLogActivity.positionChange,
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Banner Id not found!',
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Banner Id not found! Please try again with banner id',
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
                message: error.message || 'Some error occurred while updating banner'
            }, req);
        }
    }
    async destroy(req, res) {
        try {
            const bannerId = req.params.id;
            if (bannerId) {
                const banner = await banner_service_1.default.findOne(bannerId);
                if (banner) {
                    await banner_service_1.default.destroy(bannerId);
                    const existingLanguageValues = await general_service_1.default.findOneLanguageValues(multi_languages_1.multiLanguageSources.ecommerce.banner, bannerId);
                    if (existingLanguageValues) {
                        await general_service_1.default.destroyLanguageValues(existingLanguageValues._id);
                    }
                    return controller.sendSuccessResponse(res, { message: 'Banner deleted successfully!' }, 200, {
                        sourceFromId: bannerId,
                        sourceFrom: task_log_1.adminTaskLog.ecommerce.banner,
                        activity: task_log_1.adminTaskLogActivity.delete,
                        activityStatus: task_log_1.adminTaskLogStatus.success
                    });
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'This banner details not found!',
                    });
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Banner id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting banner' });
        }
    }
}
exports.default = new BannerController();

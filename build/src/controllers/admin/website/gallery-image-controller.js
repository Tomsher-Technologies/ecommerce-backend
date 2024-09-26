"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const helpers_1 = require("../../../utils/helpers");
const task_log_1 = require("../../../constants/admin/task-log");
const base_controller_1 = __importDefault(require("../base-controller"));
const gallery_image_schema_1 = require("../../../utils/schemas/admin/ecommerce/gallery-image-schema");
const gallery_image_service_1 = __importDefault(require("../../../services/admin/website/gallery-image-service"));
const collections_1 = require("../../../constants/collections");
const controller = new base_controller_1.default();
class GalleryImageController extends base_controller_1.default {
    async findAll(req, res) {
        try {
            const { page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '', page = '', pageReference = '', countryId = '' } = req.query;
            let query = { _id: { $exists: true } };
            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            }
            else {
                query.status = '1';
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
            const galleryImages = await gallery_image_service_1.default.findAll({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort
            });
            return controller.sendSuccessResponse(res, {
                requestedData: galleryImages,
                totalCount: await gallery_image_service_1.default.getTotalCount(query),
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching Gallery images' });
        }
    }
    async create(req, res) {
        try {
            const validatedData = gallery_image_schema_1.galleryImageSchema.safeParse(req.body);
            if (validatedData.success) {
                const { imageTitle, sourceFrom, sourceFromId, status, page, pageReference, } = validatedData.data;
                const user = res.locals.user;
                const galleryImage = req.files.filter((file) => file.fieldname &&
                    file.fieldname.startsWith('galleryImage'));
                if (galleryImage?.length > 0) {
                    const resultArray = [];
                    for (let i = 0; i < galleryImage.length; i++) {
                        const galleryImageData = {
                            imageTitle: galleryImage[i].originalname,
                            galleryImageUrl: (0, helpers_1.handleFileUpload)(req, null, (galleryImage[i]), 'galleryImageUrl', 'galleryimages'),
                            sourceFromId: sourceFromId === '' ? null : sourceFromId,
                            sourceFrom: sourceFrom,
                            page,
                            pageReference,
                            status: status || '1',
                            createdBy: user._id,
                            createdAt: new Date()
                        };
                        const newgalleryImage = await gallery_image_service_1.default.create(galleryImageData);
                        resultArray.push(newgalleryImage);
                    }
                    return controller.sendSuccessResponse(res, {
                        requestedData: resultArray,
                        message: 'Gallery Image added successfully!'
                    }, 200, {
                        userId: user._id,
                        countryId: user.countryId,
                        sourceCollection: collections_1.collections.website.gallaryImages,
                        referenceData: JSON.stringify(resultArray, null, 2),
                        sourceFrom: task_log_1.adminTaskLog.website.galleryimages,
                        activity: task_log_1.adminTaskLogActivity.delete,
                        activityComment: 'Gallery Image added successfully!',
                        activityStatus: task_log_1.adminTaskLogStatus.success
                    });
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                        validation: "Gallery image is required"
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
            const galleryImageId = req.params.id;
            if (galleryImageId) {
                const galleryImage = await gallery_image_service_1.default.findOne(galleryImageId);
                return controller.sendSuccessResponse(res, {
                    requestedData: galleryImage,
                    message: 'Success'
                });
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Gallery images Id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
    async update(req, res) {
        try {
            console.log(req.body);
            const validatedData = gallery_image_schema_1.galleryImageSchema.safeParse(req.body);
            if (validatedData.success) {
                const galleryImageId = req.params.id;
                if (galleryImageId) {
                    const galleryImage = req.files.find((file) => file.fieldname === 'galleryImage');
                    let updatedGalleryImageData = req.body;
                    updatedGalleryImageData = {
                        ...updatedGalleryImageData,
                        sourceFromId: updatedGalleryImageData.sourceFromId === '' ? null : updatedGalleryImageData.sourceFromId,
                        galleryImageUrl: (0, helpers_1.handleFileUpload)(req, await gallery_image_service_1.default.findOne(galleryImageId), (req.file || galleryImage), 'galleryImageUrl', 'galleryimages'),
                        updatedAt: new Date()
                    };
                    const updatedGalleryImage = await gallery_image_service_1.default.update(galleryImageId, updatedGalleryImageData);
                    if (updatedGalleryImage) {
                        const updatedGalleryImageMapped = Object.keys(updatedGalleryImage).reduce((mapped, key) => {
                            mapped[key] = updatedGalleryImage[key];
                            return mapped;
                        }, {});
                        return controller.sendSuccessResponse(res, {
                            requestedData: {
                                ...updatedGalleryImageMapped,
                            },
                            message: 'GalleryImage updated successfully!'
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'GalleryImage Id not found!',
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Gallery images Id not found! Please try again with galleryImage id',
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
                message: error.message || 'Some error occurred while updating galleryImage'
            }, req);
        }
    }
    async statusChange(req, res) {
        try {
            const validatedData = gallery_image_schema_1.galleryImageSchema.safeParse(req.body);
            if (validatedData.success) {
                const galleryImageId = req.params.id;
                if (galleryImageId) {
                    let { status } = req.body;
                    const updatedgalleryImagesData = { status };
                    const updatedgalleryImages = await gallery_image_service_1.default.update(galleryImageId, updatedgalleryImagesData);
                    if (updatedgalleryImages) {
                        const user = res.locals.user;
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedgalleryImages,
                            message: 'Gallery images status updated successfully!'
                        }, 200, {
                            userId: user._id,
                            countryId: user.countryId,
                            sourceCollection: collections_1.collections.website.gallaryImages,
                            referenceData: JSON.stringify(updatedgalleryImages, null, 2),
                            sourceFromId: updatedgalleryImages._id,
                            sourceFrom: task_log_1.adminTaskLog.website.galleryimages,
                            activity: task_log_1.adminTaskLogActivity.statusChange,
                            activityComment: 'Gallery images status updated successfully!',
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Gallery images Id not found!',
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Gallery images Id not found! Please try again with galleryImage id',
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
                message: error.message || 'Some error occurred while updating galleryImage'
            }, req);
        }
    }
    async destroy(req, res) {
        try {
            const galleryImageId = req.params.id;
            if (galleryImageId) {
                const galleryImage = await gallery_image_service_1.default.findOne(galleryImageId);
                if (galleryImage) {
                    await gallery_image_service_1.default.destroy(galleryImageId);
                    const user = res.locals.user;
                    return controller.sendSuccessResponse(res, { message: 'Gallery Image deleted successfully!' }, 200, {
                        userId: user._id,
                        countryId: user.countryId,
                        sourceCollection: collections_1.collections.website.gallaryImages,
                        referenceData: JSON.stringify(galleryImage, null, 2),
                        sourceFromId: galleryImageId,
                        sourceFrom: task_log_1.adminTaskLog.website.galleryimages,
                        activity: task_log_1.adminTaskLogActivity.delete,
                        activityComment: 'Gallery Image deleted successfully!',
                        activityStatus: task_log_1.adminTaskLogStatus.success
                    });
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'This galleryImage details not found!',
                    });
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Gallery image id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting galleryImage' });
        }
    }
}
exports.default = new GalleryImageController();

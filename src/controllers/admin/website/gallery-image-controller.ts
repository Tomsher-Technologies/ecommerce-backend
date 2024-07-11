import 'module-alias/register';
import { Request, Response } from 'express';

import { formatZodError, getCountryId, handleFileUpload, slugify } from '../../../utils/helpers';
import { QueryParams, QueryParamsWithPage } from '../../../utils/types/common';
import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from '../../../constants/admin/task-log';

import BaseController from '../base-controller';
import GeneralService from '../../../services/admin/general-service';
import mongoose from 'mongoose';
import { galleryImageSchema } from '../../../utils/schemas/admin/ecommerce/gallery-image-schema';
import GalleryImageService from '../../../services/admin/website/gallery-image-service'
import { bannerSchema } from '../../../utils/schemas/admin/ecommerce/banner-schema';

const controller = new BaseController();

class GalleryImageController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '', page = '', pageReference = '', countryId = '' } = req.query as QueryParamsWithPage;
            let query: any = { _id: { $exists: true } };
            const userData = await res.locals.user;

            const country = getCountryId(userData);
            if (country) {
                query.countryId = country;
            } else if (countryId) {
                query.countryId = new mongoose.Types.ObjectId(countryId)
            }

            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            } else {
                query.status = '1';
            }

            if (page) {
                query = {
                    ...query, page: page
                } as any;
            }

            if (pageReference) {
                query = {
                    ...query, pageReference: pageReference
                } as any;
            }
            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }

            const banners = await GalleryImageService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            return controller.sendSuccessResponse(res, {
                requestedData: banners,
                totalCount: await GalleryImageService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching banners' });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = galleryImageSchema.safeParse(req.body);

            if (validatedData.success) {
                const { sourceFrom, sourceFromId, status, page, pageReference, } = validatedData.data;
                const user = res.locals.user;
                // const galleryImage = (req as any).files.find((file: any) => file.fieldname === 'galleryImage');
                // console.log(galleryImage);
                const galleryImage = (req as any).files.filter((file: any) =>
                    file.fieldname &&
                    file.fieldname.startsWith('galleryImage[')
                );

                if (galleryImage?.length > 0) {
                    const resultArray = []
                    for (let i = 0; i < galleryImage.length; i++) {

                        const galleryImageData = {
                            galleryImageUrl: handleFileUpload(req, null, (req.file || galleryImage[i]), 'galleryImageUrl', 'galleryimages'),
                            sourceFromId: sourceFromId,
                            sourceFrom: sourceFrom,
                            page,
                            pageReference,
                            status: status || '1',
                            createdBy: user._id,
                            createdAt: new Date()
                        };

                        const newgalleryImage: any = await GalleryImageService.create(galleryImageData);
                        resultArray.push(newgalleryImage)

                    }
                    return controller.sendSuccessResponse(res, {
                        requestedData: resultArray,
                        message: 'Gallery Image added successfully!'
                    }, 200);
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                        validation: "Banner image is required"
                    }, req);
                }

            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) {
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

    async findOne(req: Request, res: Response): Promise<void> {
        try {
            const galleryImageId = req.params.id;
            if (galleryImageId) {
                const banner = await GalleryImageService.findOne(galleryImageId);
                return controller.sendSuccessResponse(res, {
                    requestedData: banner,
                    message: 'Success'
                });
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Banner Id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = bannerSchema.safeParse(req.body);
            if (validatedData.success) {
                const galleryImageId = req.params.id;
                if (galleryImageId) {
                    const mewBannerImages = (req as any).files.filter((file: any) =>
                        file.fieldname &&
                        file.fieldname.startsWith('bannerImages[') &&
                        file.fieldname.includes('[bannerImage]')
                    );

                    let bannerImages: any[] = []


                    let updatedBannerData = req.body;
                    updatedBannerData = {
                        ...updatedBannerData,
                        bannerImages: bannerImages,
                        updatedAt: new Date()
                    };

                    const updatedBanner: any = await GalleryImageService.update(galleryImageId, updatedBannerData);
                    if (updatedBanner) {


                        const updatedBannerMapped = Object.keys(updatedBanner).reduce((mapped: any, key: string) => {
                            mapped[key] = updatedBanner[key];
                            return mapped;
                        }, {});

                        return controller.sendSuccessResponse(res, {
                            requestedData: {
                                ...updatedBannerMapped,
                            },
                            message: 'Banner updated successfully!'
                        });
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Banner Id not found!',
                        }, req);
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Banner Id not found! Please try again with banner id',
                    }, req);
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating galleryImage'
            }, req);
        }
    }

    async statusChange(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = bannerSchema.safeParse(req.body);
            if (validatedData.success) {
                const galleryImageId = req.params.id;
                if (galleryImageId) {
                    let { status } = req.body;
                    const updatedBannerData = { status };

                    const updatedBanner = await GalleryImageService.update(galleryImageId, updatedBannerData);
                    if (updatedBanner) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedBanner,
                            message: 'Banner status updated successfully!'
                        }, 200, { // task log
                            sourceFromId: updatedBanner._id,
                            sourceFrom: adminTaskLog.website.galleryimages,
                            activity: adminTaskLogActivity.statusChange,
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Banner Id not found!',
                        }, req);
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Banner Id not found! Please try again with galleryImage id',
                    }, req);
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating galleryImage'
            }, req);
        }
    }

    async destroy(req: Request, res: Response): Promise<void> {
        try {
            const galleryImageId = req.params.id;
            if (galleryImageId) {
                const galleryImage = await GalleryImageService.findOne(galleryImageId);
                if (galleryImage) {
                    await GalleryImageService.destroy(galleryImageId);

                    return controller.sendSuccessResponse(res,
                        { message: 'Banner deleted successfully!' },
                        200, { // task log
                        sourceFromId: galleryImageId,
                        sourceFrom: adminTaskLog.website.galleryimages,
                        activity: adminTaskLogActivity.delete,
                        activityStatus: adminTaskLogStatus.success
                    });
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'This galleryImage details not found!',
                    });
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Banner id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting galleryImage' });
        }
    }

}

export default new GalleryImageController();
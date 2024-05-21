import 'module-alias/register';
import { Request, Response } from 'express';

import { formatZodError, getCountryId, handleFileUpload, slugify } from '../../../utils/helpers';
import { bannerPositionSchema, bannerSchema, bannerStatusSchema } from '../../../utils/schemas/admin/ecommerce/banner-schema';
import { QueryParams } from '../../../utils/types/common';
import { multiLanguageSources } from '../../../constants/multi-languages';
import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from '../../../constants/admin/task-log';

import BaseController from '../../../controllers/admin/base-controller';
import BannerService from '../../../services/admin/ecommerce/banner-service'
import GeneralService from '../../../services/admin/general-service';
import BannerModel from '../../../model/admin/ecommerce/banner-model';
import mongoose from 'mongoose';

const controller = new BaseController();

class BannerController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, status = ['1', '2'], sortby = '', sortorder = '', keyword = '' } = req.query as QueryParams;
            let query: any = { _id: { $exists: true } };
            const userData = await res.locals.user;

            const countryId = getCountryId(userData);
            if (countryId) {
                query.countryId = countryId;
            }

            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            } else {
                query.status = '1';
            }

            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = {
                    $or: [
                        { bannerTitle: keywordRegex }
                    ],
                    ...query
                } as any;
            }
            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }

            const banners = await BannerService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            return controller.sendSuccessResponse(res, {
                requestedData: banners,
                totalCount: await BannerService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching banners' });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = bannerSchema.safeParse(req.body);
            // console.log('req', req.file);

            if (validatedData.success) {
                const { countryId, bannerTitle, slug, page, linkType, link, position, description, blocks, languageValues, status } = validatedData.data;
                const user = res.locals.user;

                const mewBannerImages = (req as any).files.filter((file: any) =>
                    file.fieldname &&
                    file.fieldname.startsWith('bannerImages[') &&
                    file.fieldname.includes('[bannerImage]')
                );
                if (mewBannerImages?.length > 0) {
                    let bannerImages = []

                    bannerImages = await BannerService.setBannerBlocksImages(req, mewBannerImages);

                    const bannerData = {
                        countryId: countryId || getCountryId(user),
                        bannerTitle,
                        slug: slug || slugify(bannerTitle),
                        page,
                        linkType,
                        link,
                        position,
                        blocks,
                        bannerImages: bannerImages,
                        bannerImagesUrl: handleFileUpload(req, null, (req.file || mewBannerImages), 'bannerImagesUrl', 'banner'),
                        description,
                        status: status || '1',
                        createdBy: user._id,
                        createdAt: new Date()
                    };
                    const newBanner = await BannerService.create(bannerData);
                    if (newBanner) {

                        if (languageValues && languageValues.length > 0) {

                            const languageValuesImages = (req as any).files.filter((file: any) =>
                                file.fieldname &&
                                file.fieldname.startsWith('languageValues[') &&
                                file.fieldname.includes('[bannerImage]')
                            );

                            await languageValues.map(async (languageValue: any, index: number) => {
                                const matchingImage = languageValuesImages.filter((image: any) => image.fieldname.includes(`languageValues[${index}]`));

                                let languageBannerImages = []
                                if (Array.isArray(matchingImage) && matchingImage?.length > 0) {
                                    languageBannerImages = await BannerService.setBannerBlocksImages(req, matchingImage);
                                }

                                GeneralService.multiLanguageFieledsManage(newBanner._id, {
                                    ...languageValue,
                                    languageValues: {
                                        ...languageValue.languageValues,
                                        bannerImages: languageBannerImages
                                    }
                                })
                            })
                        }

                        return controller.sendSuccessResponse(res, {
                            requestedData: newBanner,
                            message: 'Banner created successfully!'
                        }, 200, { // task log
                            sourceFromId: newBanner._id,
                            sourceFrom: adminTaskLog.ecommerce.banner,
                            activity: adminTaskLogActivity.create,
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Error',
                            validation: 'Something went wrong! banner cant be inserted. please try again'
                        }, req);
                    }
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

    async findOne(req: Request, res: Response): Promise<void> {
        try {
            const bannerId = req.params.id;
            if (bannerId) {
                const banner = await BannerService.findOne(bannerId);
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
                const bannerId = req.params.id;
                if (bannerId) {
                    const mewBannerImages = (req as any).files.filter((file: any) =>
                        file.fieldname &&
                        file.fieldname.startsWith('bannerImages[') &&
                        file.fieldname.includes('[bannerImage]')
                    );

                    let bannerImages: any[] = []

                    bannerImages = await BannerService.setBannerBlocksImages(req, mewBannerImages, req.body.bannerImages);

                    let updatedBannerData = req.body;
                    updatedBannerData = {
                        ...updatedBannerData,
                        bannerImages: bannerImages,
                        updatedAt: new Date()
                    };

                    const updatedBanner: any = await BannerService.update(bannerId, updatedBannerData);
                    if (updatedBanner) {

                        let newLanguageValues: any = []
                        if (updatedBannerData.languageValues && updatedBannerData.languageValues.length > 0) {

                            const languageValuesImages = (req as any).files.filter((file: any) =>
                                file.fieldname &&
                                file.fieldname.startsWith('languageValues[') &&
                                file.fieldname.includes('[bannerImage]')
                            );

                            for (let i = 0; i < updatedBannerData.languageValues.length; i++) {
                                const languageValue = updatedBannerData.languageValues[i];
                                const existingLanguageValues = await GeneralService.findOneLanguageValues(multiLanguageSources.ecommerce.banner, updatedBanner._id, languageValue.languageId);
                                const matchingImage = languageValuesImages.filter((image: any) => image.fieldname.includes(`languageValues[${i}]`));

                                let languageBannerImages = existingLanguageValues.languageValues?.bannerImages;

                                if (languageValuesImages.length > 0 && matchingImage) {
                                    languageBannerImages = await BannerService.setBannerBlocksImages(req, matchingImage, languageBannerImages);
                                }

                                const languageValues = await GeneralService.multiLanguageFieledsManage(updatedBanner._id, {
                                    ...languageValue,
                                    languageValues: {
                                        ...languageValue.languageValues,
                                        bannerImages: languageBannerImages
                                    }
                                });
                                newLanguageValues.push(languageValues);
                            }
                        }

                        const updatedBannerMapped = Object.keys(updatedBanner).reduce((mapped: any, key: string) => {
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
                message: error.message || 'Some error occurred while updating banner'
            }, req);
        }
    }

    async statusChange(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = bannerStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const bannerId = req.params.id;
                if (bannerId) {
                    let { status } = req.body;
                    const updatedBannerData = { status };

                    const updatedBanner = await BannerService.update(bannerId, updatedBannerData);
                    if (updatedBanner) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedBanner,
                            message: 'Banner status updated successfully!'
                        }, 200, { // task log
                            sourceFromId: updatedBanner._id,
                            sourceFrom: adminTaskLog.ecommerce.banner,
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
                message: error.message || 'Some error occurred while updating banner'
            }, req);
        }
    }

    async positionChange(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = bannerPositionSchema.safeParse(req.body);
            if (validatedData.success) {
                const bannerId = req.params.id;
                if (bannerId) {
                    let { position } = req.body;

                    const updatedBanner = await GeneralService.changePosition(BannerModel, bannerId, position);
                    if (updatedBanner) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedBanner,
                            message: 'Banner status updated successfully!'
                        }, 200, { // task log
                            sourceFromId: updatedBanner._id,
                            sourceFrom: adminTaskLog.ecommerce.banner,
                            activity: adminTaskLogActivity.positionChange,
                            activityStatus: adminTaskLogStatus.success
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
                message: error.message || 'Some error occurred while updating banner'
            }, req);
        }
    }

    async destroy(req: Request, res: Response): Promise<void> {
        try {
            const bannerId = req.params.id;
            if (bannerId) {
                const banner = await BannerService.findOne(bannerId);
                if (banner) {
                    await BannerService.destroy(bannerId);

                    const existingLanguageValues = await GeneralService.findOneLanguageValues(multiLanguageSources.ecommerce.banner, bannerId);
                    if (existingLanguageValues) {
                        await GeneralService.destroyLanguageValues(existingLanguageValues._id);
                    }
                    return controller.sendSuccessResponse(res,
                        { message: 'Banner deleted successfully!' },
                        200, { // task log
                        sourceFromId: bannerId,
                        sourceFrom: adminTaskLog.ecommerce.banner,
                        activity: adminTaskLogActivity.delete,
                        activityStatus: adminTaskLogStatus.success
                    });
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'This banner details not found!',
                    });
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Banner id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting banner' });
        }
    }

}

export default new BannerController();
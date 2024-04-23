import 'module-alias/register';
import { Request, Response } from 'express';

import { formatZodError, handleFileUpload, slugify } from '@utils/helpers';
import { bannerSchema } from '@utils/schemas/admin/ecommerce/banner-schema';
import { QueryParams } from '@utils/types/common';

import BaseController from '@controllers/admin/base-controller';
import BannerService from '@services/admin/ecommerce/banner-service'

const controller = new BaseController();

class BannerController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, status = ['1', '2'], sortby = '', sortorder = '', keyword = '' } = req.query as QueryParams; 
            let query: any = { _id: { $exists: true } };

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

            controller.sendSuccessResponse(res, {
                requestedData: banners,
                totalCount: await BannerService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching banners' });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = bannerSchema.safeParse(req.body);
            // console.log('req', req.file);

            if (validatedData.success) {
                const { bannerTitle, slug, description, pageTitle } = validatedData.data;
                const user = res.locals.user;

                const bannerData = {
                    bannerTitle,
                    slug: slug || slugify(bannerTitle),
                    bannerImageUrl: handleFileUpload(req, null, req.file, 'bannerImageUrl', 'banner'),
                    description,
                    pageTitle,
                    status: '1',
                    createdBy: user._id,
                    createdAt: new Date()
                };
                const newBanner = await BannerService.create(bannerData);
                return controller.sendSuccessResponse(res, {
                    requestedData: newBanner,
                    message: 'Banner created successfully!'
                });
            } else {
                console.log('res', (req as any).file);

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
                controller.sendSuccessResponse(res, {
                    requestedData: banner,
                    message: 'Success'
                });
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Banner Id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = bannerSchema.safeParse(req.body);
            if (validatedData.success) {
                const bannerId = req.params.id;
                if (bannerId) {
                    let updatedbannerData = req.body;
                    updatedbannerData = {
                        ...updatedbannerData,
                        bannerImageUrl: handleFileUpload(req, await BannerService.findOne(bannerId), req.file, 'bannerImageUrl', 'banner'),
                        updatedAt: new Date()
                    };

                    const updatedBanner = await BannerService.update(bannerId, updatedbannerData);
                    if (updatedBanner) {
                        controller.sendSuccessResponse(res, {
                            requestedData: updatedBanner,
                            message: 'Banner updated successfully!'
                        });
                    } else {
                        controller.sendErrorResponse(res, 200, {
                            message: 'Banner Id not found!',
                        }, req);
                    }
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Banner Id not found! Please try again with banner id',
                    }, req);
                }
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, {
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
                    controller.sendSuccessResponse(res, { message: 'Banner deleted successfully!' });
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'This banner details not found!',
                    });
                }
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Banner id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting banner' });
        }
    }

}

export default new BannerController();
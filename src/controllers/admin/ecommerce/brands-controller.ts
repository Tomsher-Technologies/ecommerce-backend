import 'module-alias/register';
import { Request, Response } from 'express';

import { formatZodError, handleFileUpload, slugify } from '@utils/helpers';
import { brandSchema, updateWebsitePrioritySchema } from '@utils/schemas/admin/ecommerce/brand-schema';
import { QueryParams } from '@utils/types/common';
import { BrandQueryParams } from '@utils/types/brands';

import BaseController from '@controllers/admin/base-controller';
import BrandsService from '@services/admin/ecommerce/brands-service'
import BrandsModel, { BrandProps } from '@model/admin/ecommerce/brands-model';

const controller = new BaseController();

class BrandsController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit =  '', status = ['1', '2'], sortby = '', sortorder = '', keyword = '' } = req.query as QueryParams; 
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
                        { brandTitle: keywordRegex }
                    ],
                    ...query
                } as any;
            }

            const keysToCheck: (keyof BrandProps)[] = ['corporateGiftsPriority'];
            const filteredQuery = keysToCheck.reduce((result: any, key) => {
                if (key in req.query) {
                    result[key] = req.query[key];
                }
                return result;
            }, {} as Partial<BrandQueryParams>);
            let filteredPriorityQuery: any = {};
            if (Object.keys(filteredQuery).length > 0) {
                for (const key in filteredQuery) {
                    if (filteredQuery[key] === '> 0') {
                        filteredPriorityQuery[key] = { $gt: 0 }; // Set query for key greater than 0
                    } else if (filteredQuery[key]  === '0') {
                        filteredPriorityQuery[key] = 0; // Set query for key equal to 0
                    } else if (filteredQuery[key]  === '< 0' || filteredQuery[key]  === null || filteredQuery[key]  === undefined) {
                        filteredPriorityQuery[key] = { $lt: 0 }; // Set query for key less than 0
                    }
                }
            }

            query = { ...query, ...filteredPriorityQuery };

            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }

            const brands = await BrandsService.findAll({ 
                page: parseInt(page_size as string), 
                limit: parseInt(limit as string), 
                query,
                sort
             });

            controller.sendSuccessResponse(res, {
                requestedData: brands,
                totalCount: await BrandsService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching brands' });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = brandSchema.safeParse(req.body);
            // console.log('req', req.file);

            if (validatedData.success) {
                const { brandTitle, slug, description, pageTitle, metaTitle, metaDescription, ogTitle, ogDescription, metaImage, twitterTitle, twitterDescription } = validatedData.data;
                const user = res.locals.user;

                const brandData: Partial<BrandProps> = {
                    brandTitle,
                    slug: slug || slugify(brandTitle) as any,
                    brandImageUrl: handleFileUpload(req, null, req.file, 'brandImageUrl', 'brand'),
                    description,
                    pageTitle: pageTitle as string,
                    metaTitle: metaTitle as string,
                    metaDescription: metaDescription as string,
                    ogTitle: ogTitle as string,
                    ogDescription: ogDescription as string,
                    metaImageUrl: metaImage as string,
                    twitterTitle: twitterTitle as string,
                    twitterDescription: twitterDescription as string,
                    status: '1', // active
                    statusAt: new Date(),
                    createdBy: user._id,
                    createdAt: new Date(),
                    updatedAt: new Date() 
                };


                const newBrand = await BrandsService.create(brandData);
                // const fetchedBrand = await BrandsService.findOne(newBrand._id);
                return controller.sendSuccessResponse(res, {
                    requestedData: newBrand,
                    message: 'Brand created successfully!'
                });
            } else {
                console.log('res', (req as any).file);

                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) {
            if (error.code === 11000 && error.keyPattern && error.keyPattern.brandTitle) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        brandTitle: "Brand name already exists"
                    }
                }, req);
            }
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating brand',
            }, req);
        }
    }


    async findOne(req: Request, res: Response): Promise<void> {
        try {
            const brandId = req.params.id;
            if (brandId) {
                const brand = await BrandsService.findOne(brandId);
                controller.sendSuccessResponse(res, {
                    requestedData: brandId,
                    message: 'Success'
                });
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Brand Id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = brandSchema.safeParse(req.body);
            if (validatedData.success) {
                const brandId = req.params.id;
                if (brandId) {
                    let updatedbrandData = req.body;
                    updatedbrandData = {
                        ...updatedbrandData,
                        brandImageUrl: handleFileUpload(req, await BrandsService.findOne(brandId), req.file, 'brandImageUrl', 'brand'),
                        updatedAt: new Date()
                    };

                    const updatedBrand = await BrandsService.update(brandId, updatedbrandData);
                    if (updatedBrand) {
                        controller.sendSuccessResponse(res, {
                            requestedData: updatedBrand,
                            message: 'Brand updated successfully!'
                        });
                    } else {
                        controller.sendErrorResponse(res, 200, {
                            message: 'Brand Id not found!',
                        }, req);
                    }
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Brand Id not found! Please try again with brand id',
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
                message: error.message || 'Some error occurred while updating brand'
            }, req);
        }
    }

    async destroy(req: Request, res: Response): Promise<void> {
        try {
            const brandId = req.params.id;
            if (brandId) {
                const brand = await BrandsService.findOne(brandId);
                if (brandId) {
                    await BrandsService.destroy(brandId);
                    controller.sendSuccessResponse(res, { message: 'Brand deleted successfully!' });
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'This Brand details not found!',
                    });
                }
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Brand id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting brand' });
        }
    }

    async updateWebsitePriority(req: Request, res: Response): Promise<void> {
        try {

            const validatedData = updateWebsitePrioritySchema.safeParse(req.body);
            if (validatedData.success) {
                const { keyColumn, root, container1 } = validatedData.data;
                const validKeys: (keyof BrandProps)[] = ['corporateGiftsPriority'];

                if (validKeys.includes(keyColumn as keyof BrandProps)) {
                    let updatedBrandData = req.body;
                    updatedBrandData = {
                        ...updatedBrandData,
                        updatedAt: new Date()
                    };
                    await BrandsService.updateWebsitePriority(container1, keyColumn as keyof BrandProps);

                    return controller.sendSuccessResponse(res, {
                        requestedData: await BrandsModel.find({ [keyColumn]: { $gt: '0' } }).sort({ [keyColumn]: 'asc' }),
                        message: 'Brand website priority updated successfully!'
                    });
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Invalid key column provided',
                    }, req);
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating brand',
            }, req);
        }
    }

}

export default new BrandsController();
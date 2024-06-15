import 'module-alias/register';
import { Request, Response } from 'express';

import { capitalizeWords, formatZodError, handleFileUpload, slugify } from '../../../utils/helpers';
import { brandSchema, brandStatusSchema, updateWebsitePrioritySchema } from '../../../utils/schemas/admin/ecommerce/brand-schema';
import { QueryParams } from '../../../utils/types/common';
import { BrandQueryParams } from '../../../utils/types/brands';
import { multiLanguageSources } from '../../../constants/multi-languages';
import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from '../../../constants/admin/task-log';

import BaseController from '../../../controllers/admin/base-controller';
import BrandsService from '../../../services/admin/ecommerce/brands-service'
import BrandsModel, { BrandProps } from '../../../model/admin/ecommerce/brands-model';
import GeneralService from '../../../services/admin/general-service';
import mongoose from 'mongoose';
import CollectionsBrandsService from '../../../services/admin/website/collections-brands-service';

const controller = new BaseController();

class BrandsController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { _id, unCollectionedBrands, page_size = 1, limit = '', status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '', brandId = '' } = req.query as BrandQueryParams;
            let query: any = { _id: { $exists: true } };
            let brand: any
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

            if (_id) {
                if (typeof _id === 'string') {
                    query = {
                        ...query, _id: new mongoose.Types.ObjectId(_id)
                    } as any;
                } else {
                    const brandIds = _id.map((id: any) => new mongoose.Types.ObjectId(id));
                    brand = {
                        _id: { $in: brandIds }
                    };
                }
            }

            if (brand && (Object.keys(brand)).length > 0) {
                query = {
                    ...query, ...brand
                } as any;
            }
            if (brandId) {
                query = {
                    ...query, _id: new mongoose.Types.ObjectId(brandId)
                } as any;
            }

            const keysToCheck: (keyof BrandProps)[] = ['corporateGiftsPriority', 'brandListPriority'];
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
                        filteredPriorityQuery[key] = { $gt: '0' }; // Set query for key greater than 0
                    } else if (filteredQuery[key] === '0') {
                        filteredPriorityQuery[key] = '0'; // Set query for key equal to 0
                    } else if (filteredQuery[key] === '< 0' || filteredQuery[key] === null || filteredQuery[key] === undefined) {
                        filteredPriorityQuery[key] = { $lt: '0' }; // Set query for key less than 0
                    }
                }
            }

            if (unCollectionedBrands) {
                const collection = await CollectionsBrandsService.findOne(unCollectionedBrands);
                // console.log('collection', collection, unCollectionedBrands);

                if (collection) {
                    const unCollectionedBrandIds = collection.collectionsBrands.map(id => new mongoose.Types.ObjectId(id));
                    if (unCollectionedBrandIds.length > 0) {
                        query._id = { $nin: unCollectionedBrandIds };
                        query.status = '1';
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

            return controller.sendSuccessResponse(res, {
                requestedData: brands,
                totalCount: await BrandsService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching brands' });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = brandSchema.safeParse(req.body);
            // console.log('req', req.file);

            if (validatedData.success) {
                const { brandTitle, slug, description, metaTitle, metaDescription, ogTitle, ogDescription, metaImage, twitterTitle, twitterDescription, languageValues, status } = validatedData.data;
                const user = res.locals.user;

                const brandImage = (req as any).files.find((file: any) => file.fieldname === 'brandImage');
                const brandBannerImage = (req as any).files.find((file: any) => file.fieldname === 'brandBannerImage');

                const brandData: Partial<BrandProps> = {
                    brandTitle: capitalizeWords(brandTitle),
                    slug: slug || slugify(brandTitle) as any,
                    brandImageUrl: handleFileUpload(req, null, (req.file || brandImage), 'brandImageUrl', 'brand'),
                    brandBannerImageUrl: handleFileUpload(req, null, (req.file || brandBannerImage), 'brandBannerImageUrl', 'brand'),
                    description,
                    metaTitle: metaTitle as string,
                    metaDescription: metaDescription as string,
                    ogTitle: ogTitle as string,
                    ogDescription: ogDescription as string,
                    metaImageUrl: metaImage as string,
                    twitterTitle: twitterTitle as string,
                    twitterDescription: twitterDescription as string,
                    ['status' as string]: status || '1',
                    statusAt: new Date(),
                    createdBy: user._id,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                const newBrand = await BrandsService.create(brandData);
                // const fetchedBrand = await BrandsService.findOne(newBrand._id);
                if (newBrand) {
                    const languageValuesImages = (req as any).files.filter((file: any) =>
                        file.fieldname &&
                        file.fieldname.startsWith('languageValues[') &&
                        file.fieldname.includes('[brandImage]')
                    );
                    const languageValuesBannerImages = (req as any).files.filter((file: any) =>
                        file.fieldname &&
                        file.fieldname.startsWith('languageValues[') &&
                        file.fieldname.includes('[brandBannerImage]')
                    );

                    if (languageValues && Array.isArray(languageValues) && languageValues.length > 0) {
                        await languageValues?.map((languageValue: any, index: number) => {

                            let brandImageUrl = ''
                            if (languageValuesImages.length > 0) {
                                brandImageUrl = handleFileUpload(req, null, languageValuesImages[index], `brandImageUrl`, 'brand');
                            }
                            let brandBannerImageUrl = ''
                            if (languageValuesBannerImages.length > 0) {
                                brandBannerImageUrl = handleFileUpload(req, null, languageValuesBannerImages[index], `brandBannerImageUrl`, 'brand');
                            }

                            const languageValues = GeneralService.multiLanguageFieledsManage(newBrand._id, {
                                ...languageValue,
                                languageValues: {
                                    ...languageValue.languageValues,
                                    brandImageUrl,
                                    brandBannerImageUrl
                                }
                            })
                        })
                    }

                    return controller.sendSuccessResponse(res, {
                        requestedData: {
                            ...newBrand,
                            languageValues: languageValues
                        },
                        message: 'Brand created successfully!'
                    }, 200, { // task log
                        sourceFromId: newBrand._id,
                        sourceFrom: adminTaskLog.ecommerce.brands,
                        activity: adminTaskLogActivity.create,
                        activityStatus: adminTaskLogStatus.success
                    });
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Error',
                        validation: 'Something went wrong! brand cant be inserted. please try again'
                    }, req);
                }
            } else {

                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) {
            if (error && error.errors && error.errors.brandTitle && error.errors.brandTitle.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        brandTitle: error.errors.brandTitle.properties.message
                    }
                }, req);
            } else if (error && error.errors && error.errors.brandImageUrl && error.errors.brandImageUrl.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        brandTitle: error.errors.brandImageUrl.properties.message
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
                return controller.sendSuccessResponse(res, {
                    requestedData: brandId,
                    message: 'Success'
                });
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Brand Id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = brandSchema.safeParse(req.body);
            if (validatedData.success) {
                const brandId = req.params.id;
                if (brandId) {
                    const brandImage = (req as any).files.find((file: any) => file.fieldname === 'brandImage');
                    const brandBannerImage = (req as any).files.find((file: any) => file.fieldname === 'brandBannerImage');

                    let updatedBrandData = req.body;
                    updatedBrandData = {
                        ...updatedBrandData,
                        brandTitle: await capitalizeWords(updatedBrandData.brandTitle),
                        brandImageUrl: handleFileUpload(req, await BrandsService.findOne(brandId), (req.file || brandImage), 'brandImageUrl', 'brand'),
                        brandBannerImageUrl: handleFileUpload(req, await BrandsService.findOne(brandId), (req.file || brandBannerImage), 'brandBannerImageUrl', 'brand'),
                        updatedAt: new Date()
                    };

                    const updatedBrand: any = await BrandsService.update(brandId, updatedBrandData);
                    if (updatedBrand) {

                        const languageValuesImages = (req as any).files.filter((file: any) =>
                            file.fieldname &&
                            file.fieldname.startsWith('languageValues[') &&
                            file.fieldname.includes('[brandImage]')
                        );
                        const languageValuesBannerImages = (req as any).files.filter((file: any) =>
                            file.fieldname &&
                            file.fieldname.startsWith('languageValues[') &&
                            file.fieldname.includes('[brandBannerImage]')
                        );

                        let newLanguageValues: any = []
                        if (updatedBrandData.languageValues && updatedBrandData.languageValues.length > 0) {
                            for (let i = 0; i < updatedBrandData.languageValues.length; i++) {
                                const languageValue = updatedBrandData.languageValues[i];
                                let brandImageUrl = '';
                                let brandBannerImageUrl = '';
                                const matchingImage = languageValuesImages.find((image: any) => image.fieldname.includes(`languageValues[${i}]`));

                                if (languageValuesImages.length > 0 && matchingImage) {
                                    const existingLanguageValues = await GeneralService.findOneLanguageValues(multiLanguageSources.ecommerce.brands, updatedBrand._id, languageValue.languageId);
                                    brandImageUrl = await handleFileUpload(req, existingLanguageValues.languageValues, matchingImage, `brandImageUrl`, 'brand');
                                } else {
                                    brandImageUrl = updatedBrandData.languageValues[i].languageValues?.brandImageUrl
                                }
                                const matchingBannerImage = languageValuesBannerImages.find((image: any) => image.fieldname.includes(`languageValues[${i}]`));

                                if (languageValuesBannerImages.length > 0 && matchingBannerImage) {
                                    const existingLanguageValues = await GeneralService.findOneLanguageValues(multiLanguageSources.ecommerce.brands, updatedBrand._id, languageValue.languageId);
                                    brandBannerImageUrl = await handleFileUpload(req, existingLanguageValues.languageValues, matchingBannerImage, `brandBannerImageUrl`, 'brand');
                                } else {
                                    brandBannerImageUrl = updatedBrandData.languageValues[i].languageValues?.brandBannerImageUrl
                                }

                                const languageValues = await GeneralService.multiLanguageFieledsManage(updatedBrand._id, {
                                    ...languageValue,
                                    languageValues: {
                                        ...languageValue.languageValues,
                                        brandImageUrl
                                    }
                                });
                                newLanguageValues.push(languageValues);
                            }
                        }

                        const updatedBrandMapped = Object.keys(updatedBrand).reduce((mapped: any, key: string) => {
                            mapped[key] = updatedBrand[key];
                            return mapped;
                        }, {});

                        return controller.sendSuccessResponse(res, {
                            requestedData: {
                                ...updatedBrandMapped,
                                languageValues: newLanguageValues
                            },
                            message: 'Brand updated successfully!'
                        }, 200, { // task log
                            sourceFromId: updatedBrandMapped._id,
                            sourceFrom: adminTaskLog.ecommerce.brands,
                            activity: adminTaskLogActivity.update,
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Brand Id not found!',
                        }, req);
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Brand Id not found! Please try again with brand id',
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
                message: error.message || 'Some error occurred while updating brand'
            }, req);
        }
    }

    async statusChange(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = brandStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const brandId = req.params.id;
                if (brandId) {
                    let { status } = req.body;
                    const updatedBrandData = { status };

                    const updatedBrand = await BrandsService.update(brandId, updatedBrandData);
                    if (updatedBrand) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedBrand,
                            message: 'Brand status updated successfully!'
                        }, 200, { // task log
                            sourceFromId: brandId,
                            sourceFrom: adminTaskLog.ecommerce.brands,
                            activity: adminTaskLogActivity.delete,
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Brand Id not found!',
                        }, req);
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Brand Id not found! Please try again with brand id',
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
                    // await BrandsService.destroy(brandId);
                    //  controller.sendSuccessResponse(res, { message: 'Brand deleted successfully!' });
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Cant to be delete brand!',
                    });
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'This Brand details not found!',
                    });
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Brand id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting brand' });
        }
    }

    async updateWebsitePriority(req: Request, res: Response): Promise<void> {
        try {

            const validatedData = updateWebsitePrioritySchema.safeParse(req.body);
            if (validatedData.success) {
                const { keyColumn, root, container1 } = validatedData.data;
                const validKeys: (keyof BrandProps)[] = ['corporateGiftsPriority', 'brandListPriority'];

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
                    }, 200, { // task log
                        sourceFromId: '',
                        sourceFrom: adminTaskLog.ecommerce.brands,
                        activity: adminTaskLogActivity.priorityUpdation,
                        activityStatus: adminTaskLogStatus.success
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
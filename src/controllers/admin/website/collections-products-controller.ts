import 'module-alias/register';
import { Request, Response } from 'express';

import { deleteFile, formatZodError, handleFileUpload, slugify, stringToArray } from '../../../utils/helpers';
import { QueryParams } from '../../../utils/types/common';

import BaseController from '../../../controllers/admin/base-controller';
import CollectionsProductsService from '../../../services/admin/website/collections-products-service';
import { collectionProductSchema } from '../../../utils/schemas/admin/website/collection-product-shema';
import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from '../../../constants/admin/task-log';

import GeneralService from '../../../services/admin/general-service';
import { multiLanguageSources } from '../../../constants/multi-languages';

const controller = new BaseController();

class CollectionsProductsController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = '', status = ['1', '2'], sortby = '', sortorder = '', keyword = '' } = req.query as QueryParams;
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
                        { collectionTitle: keywordRegex },
                        { linkType: keywordRegex },
                    ],
                    ...query
                } as any;
            }
            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }

            const collections = await CollectionsProductsService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            return controller.sendSuccessResponse(res, {
                requestedData: collections,
                totalCount: await CollectionsProductsService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching collections' });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = collectionProductSchema.safeParse(req.body);

            const collectionImage = (req as any).files.find((file: any) => file.fieldname === 'collectionImage');

            if (validatedData.success) {
                const { collectionTitle, slug, collectionSubTitle, collectionsProducts, languageValues } = validatedData.data;
                const user = res.locals.user;

                const collectionData = {
                    collectionTitle,
                    slug: slug || slugify(collectionTitle),
                    collectionSubTitle,
                    collectionsProducts: collectionsProducts ? collectionsProducts.split(',').map((id: string) => id.trim()) : [],
                    collectionImageUrl: handleFileUpload(req, null, (req.file || collectionImage), 'collectionImageUrl', 'collection'),
                    status: '1',
                    createdBy: user._id,
                    createdAt: new Date()
                };

                const newCollection = await CollectionsProductsService.create(collectionData);
                if (newCollection) {
                    const languageValuesImages = (req as any).files.filter((file: any) =>
                        file.fieldname &&
                        file.fieldname.startsWith('languageValues[') &&
                        file.fieldname.includes('[collectionImage]')
                    );

                    if (languageValues && languageValues.length > 0) {
                        await languageValues.map((languageValue: any, index: number) => {

                            let collectionImageUrl = ''
                            if (languageValuesImages.length > 0) {
                                collectionImageUrl = handleFileUpload(req, null, languageValuesImages[index], `collectionImageUrl`, 'collection');
                            }

                            GeneralService.multiLanguageFieledsManage(newCollection._id, {
                                ...languageValue,
                                languageValues: {
                                    ...languageValue.languageValues,
                                    collectionImageUrl
                                }
                            })
                        })
                    }

                    return controller.sendSuccessResponse(res, {
                        requestedData: newCollection,
                        message: 'Collection created successfully!'
                    }, 200, { // task log
                        sourceFromId: newCollection._id,
                        sourceFrom: adminTaskLog.website.collectionsProducts,
                        activity: adminTaskLogActivity.create,
                        activityStatus: adminTaskLogStatus.success
                    });
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Error',
                        validation: 'Something went wrong! collection cant be inserted. please try again'
                    }, req);
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) {
            if (error && error.errors && error.errors.collectionTitle && error.errors.collectionTitle.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        collectionTitle: error.errors.collectionTitle.properties.message
                    }
                }, req);
            }
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating collection',
            }, req);
        }
    }


    async findOne(req: Request, res: Response): Promise<void> {
        try {
            const collectionId = req.params.id;
            if (collectionId) {
                const collection: any = await CollectionsProductsService.findOne(collectionId);
                if (collection) {
                    const collectionProducts = await CollectionsProductsService.findCollectionProducts(collection.collectionsProducts);
                    // const unCollectionedProducts = await CollectionsProductsService.findUnCollectionedProducts(collection.collectionsProducts);

                    return controller.sendSuccessResponse(res, {
                        requestedData: {
                            _id: collection._id,
                            collectionTitle: collection.collectionTitle,
                            slug: collection.slug,
                            collectionSubTitle: collection.collectionSubTitle,
                            collectionImageUrl: collection.collectionImageUrl,
                            collectionsProducts: collectionProducts,
                            languageValues: collection.languageValues,
                            // unCollectionedProducts: unCollectionedProducts,
                        },
                        message: 'Success'
                    });
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Collection not found!',
                    });
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Collection Id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = collectionProductSchema.safeParse(req.body);
            if (validatedData.success) {
                const collectionId = req.params.id;
                if (collectionId) {
                    const { collectionsProducts } = validatedData.data;
                    let updatedCollectionData = req.body;
                    updatedCollectionData = {
                        ...updatedCollectionData,
                        collectionsProducts: collectionsProducts ? collectionsProducts.split(',').map((id: string) => id.trim()) : [],
                        collectionImageUrl: handleFileUpload(req, await CollectionsProductsService.findOne(collectionId), req.file, 'collectionImageUrl', 'collection'),
                        updatedAt: new Date()
                    };

                    const updatedCollection = await CollectionsProductsService.update(collectionId, updatedCollectionData);
                    if (updatedCollection) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedCollection,
                            message: 'Collection updated successfully!'
                        }, 200, { // task log
                            sourceFromId: updatedCollection._id,
                            sourceFrom: adminTaskLog.website.collectionsProducts,
                            activity: adminTaskLogActivity.update,
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Collection Id not found!',
                        }, req);
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Collection Id not found! Please try again with collection id',
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
                message: error.message || 'Some error occurred while updating collection'
            }, req);
        }
    }

    async destroy(req: Request, res: Response): Promise<void> {
        try {
            const collectionId = req.params.id;
            if (collectionId) {
                const collection = await CollectionsProductsService.findOne(collectionId);
                if (collection) {
                    await CollectionsProductsService.destroy(collectionId);
                    const existingLanguageValues = await GeneralService.findOneLanguageValues(multiLanguageSources.website.collectionsProducts, collectionId);
                    if (existingLanguageValues) {
                        await GeneralService.destroyLanguageValues(existingLanguageValues._id);
                    }

                    // console.log('collectionData', path.join(__dirname, `../../../${collection.collectionImageUrl}`));
                    // deleteFile(path.join(__dirname, `../../../${collection.collectionImageUrl}`))
                    return controller.sendSuccessResponse(res, {
                        message: 'Collection deleted successfully!',
                        requestedData: {
                            collectionId: collectionId
                        }
                    }, 200, { // task log
                        sourceFromId: collectionId,
                        sourceFrom: adminTaskLog.website.collectionsProducts,
                        activity: adminTaskLogActivity.delete,
                        activityStatus: adminTaskLogStatus.success
                    });
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'This collection details not found!',
                    });
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Collection id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting collection' });
        }
    }

}

export default new CollectionsProductsController();
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const helpers_1 = require("../../../utils/helpers");
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const collections_products_service_1 = __importDefault(require("../../../services/admin/website/collections-products-service"));
const collection_product_shema_1 = require("../../../utils/schemas/admin/website/collection-product-shema");
const task_log_1 = require("../../../constants/admin/task-log");
const general_service_1 = __importDefault(require("../../../services/admin/general-service"));
const multi_languages_1 = require("../../../constants/multi-languages");
const controller = new base_controller_1.default();
class CollectionsProductsController extends base_controller_1.default {
    async findAll(req, res) {
        try {
            const { page_size = 1, limit = '', status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '', page = '', pageReference = '' } = req.query;
            let query = { _id: { $exists: true } };
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
                        { collectionTitle: keywordRegex },
                        { linkType: keywordRegex },
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
            const collections = await collections_products_service_1.default.findAll({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort
            });
            return controller.sendSuccessResponse(res, {
                requestedData: collections,
                totalCount: await collections_products_service_1.default.getTotalCount(query),
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching collections' });
        }
    }
    async create(req, res) {
        try {
            const validatedData = collection_product_shema_1.collectionProductSchema.safeParse(req.body);
            const collectionImage = req.files.find((file) => file.fieldname === 'collectionImage');
            if (validatedData.success) {
                const { countryId, collectionTitle, slug, collectionSubTitle, collectionsProducts, page, pageReference, languageValues } = validatedData.data;
                const user = res.locals.user;
                const collectionData = {
                    countryId: countryId || (0, helpers_1.getCountryId)(user),
                    collectionTitle,
                    slug: slug || (0, helpers_1.slugify)(collectionTitle),
                    collectionSubTitle,
                    page,
                    pageReference,
                    collectionsProducts: collectionsProducts ? collectionsProducts.split(',').map((id) => id.trim()) : [],
                    collectionImageUrl: (0, helpers_1.handleFileUpload)(req, null, (req.file || collectionImage), 'collectionImageUrl', 'collection'),
                    status: '1',
                    createdBy: user._id,
                    createdAt: new Date()
                };
                const newCollection = await collections_products_service_1.default.create(collectionData);
                if (newCollection) {
                    const languageValuesImages = req.files.filter((file) => file.fieldname &&
                        file.fieldname.startsWith('languageValues[') &&
                        file.fieldname.includes('[collectionImage]'));
                    if (languageValues && Array.isArray(languageValues) && languageValues.length > 0) {
                        await languageValues?.map((languageValue, index) => {
                            let collectionImageUrl = '';
                            if (languageValuesImages.length > 0) {
                                collectionImageUrl = (0, helpers_1.handleFileUpload)(req, null, languageValuesImages[index], `collectionImageUrl`, 'collection');
                            }
                            general_service_1.default.multiLanguageFieledsManage(newCollection._id, {
                                ...languageValue,
                                languageValues: {
                                    ...languageValue.languageValues,
                                    collectionImageUrl
                                }
                            });
                        });
                    }
                    return controller.sendSuccessResponse(res, {
                        requestedData: newCollection,
                        message: 'Collection created successfully!'
                    }, 200, {
                        sourceFromId: newCollection._id,
                        sourceFrom: task_log_1.adminTaskLog.website.collectionsProducts,
                        activity: task_log_1.adminTaskLogActivity.create,
                        activityStatus: task_log_1.adminTaskLogStatus.success
                    });
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Error',
                        validation: 'Something went wrong! collection cant be inserted. please try again'
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
            if (error && error.errors && error.errors.collectionTitle && error.errors.collectionTitle.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        collectionTitle: error.errors.collectionTitle.properties.message
                    }
                }, req);
            }
            else if (error && error.errors && error.errors.collectionImageUrl && error.errors.collectionImageUrl.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        collectionImageUrl: error.errors.collectionImageUrl.properties.message
                    }
                }, req);
            }
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating collection',
            }, req);
        }
    }
    async findOne(req, res) {
        try {
            const collectionId = req.params.id;
            if (collectionId) {
                const collection = await collections_products_service_1.default.findOne(collectionId);
                if (collection) {
                    const collectionProducts = await collections_products_service_1.default.findCollectionProducts(collection.collectionsProducts);
                    // const unCollectionedProducts = await CollectionsProductsService.findUnCollectionedProducts(collection.collectionsProducts);
                    return controller.sendSuccessResponse(res, {
                        requestedData: {
                            _id: collection._id,
                            countryId: collection.countryId,
                            collectionTitle: collection.collectionTitle,
                            page: collection.page,
                            pageReference: collection.pageReference,
                            status: collection.status,
                            slug: collection.slug,
                            collectionSubTitle: collection.collectionSubTitle,
                            collectionImageUrl: collection.collectionImageUrl,
                            collectionsProducts: collectionProducts,
                            languageValues: collection.languageValues,
                            // unCollectionedProducts: unCollectionedProducts,
                        },
                        message: 'Success'
                    });
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Collection not found!',
                    });
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Collection Id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
    async update(req, res) {
        try {
            const validatedData = collection_product_shema_1.collectionProductSchema.safeParse(req.body);
            if (validatedData.success) {
                const collectionId = req.params.id;
                if (collectionId) {
                    const { collectionsProducts } = validatedData.data;
                    let updatedCollectionData = req.body;
                    updatedCollectionData = {
                        ...updatedCollectionData,
                        collectionsProducts: collectionsProducts ? collectionsProducts.split(',').map((id) => id.trim()) : [],
                        collectionImageUrl: (0, helpers_1.handleFileUpload)(req, await collections_products_service_1.default.findOne(collectionId), req.file, 'collectionImageUrl', 'collection'),
                        updatedAt: new Date()
                    };
                    const updatedCollection = await collections_products_service_1.default.update(collectionId, updatedCollectionData);
                    if (updatedCollection) {
                        const languageValuesImages = req.files.filter((file) => file.fieldname &&
                            file.fieldname.startsWith('languageValues[') &&
                            file.fieldname.includes('[collectionImage]'));
                        let newLanguageValues = [];
                        if (updatedCollectionData.languageValues && Array.isArray(updatedCollectionData.languageValues) && updatedCollectionData.languageValues.length > 0) {
                            for (let i = 0; i < updatedCollectionData.languageValues.length; i++) {
                                const languageValue = updatedCollectionData.languageValues[i];
                                let collectionImageUrl = '';
                                const matchingImage = languageValuesImages.find((image) => image.fieldname.includes(`languageValues[${i}]`));
                                if (languageValuesImages.length > 0 && matchingImage) {
                                    const existingLanguageValues = await general_service_1.default.findOneLanguageValues(multi_languages_1.multiLanguageSources.ecommerce.sliders, updatedCollection._id, languageValue.languageId);
                                    collectionImageUrl = await (0, helpers_1.handleFileUpload)(req, existingLanguageValues.languageValues, matchingImage, `collectionImageUrl`, 'collection');
                                }
                                else {
                                    collectionImageUrl = updatedCollectionData.languageValues[i].languageValues?.collectionImageUrl;
                                }
                                const languageValues = await general_service_1.default.multiLanguageFieledsManage(updatedCollection._id, {
                                    ...languageValue,
                                    languageValues: {
                                        ...languageValue.languageValues,
                                        collectionImageUrl
                                    }
                                });
                                newLanguageValues.push(languageValues);
                            }
                        }
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedCollection,
                            message: 'Collection updated successfully!'
                        }, 200, {
                            sourceFromId: updatedCollection._id,
                            sourceFrom: task_log_1.adminTaskLog.website.collectionsProducts,
                            activity: task_log_1.adminTaskLogActivity.update,
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Collection Id not found!',
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Collection Id not found! Please try again with collection id',
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
                message: error.message || 'Some error occurred while updating collection'
            }, req);
        }
    }
    async destroy(req, res) {
        try {
            const collectionId = req.params.id;
            if (collectionId) {
                const collection = await collections_products_service_1.default.findOne(collectionId);
                if (collection) {
                    await collections_products_service_1.default.destroy(collectionId);
                    const existingLanguageValues = await general_service_1.default.findOneLanguageValues(multi_languages_1.multiLanguageSources.website.collectionsProducts, collectionId);
                    if (existingLanguageValues) {
                        await general_service_1.default.destroyLanguageValues(existingLanguageValues._id);
                    }
                    // console.log('collectionData', path.join(__dirname, `../../../${collection.collectionImageUrl}`));
                    // deleteFile(path.join(__dirname, `../../../${collection.collectionImageUrl}`))
                    return controller.sendSuccessResponse(res, {
                        message: 'Collection deleted successfully!',
                        requestedData: {
                            collectionId: collectionId
                        }
                    }, 200, {
                        sourceFromId: collectionId,
                        sourceFrom: task_log_1.adminTaskLog.website.collectionsProducts,
                        activity: task_log_1.adminTaskLogActivity.delete,
                        activityStatus: task_log_1.adminTaskLogStatus.success
                    });
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'This collection details not found!',
                    });
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Collection id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting collection' });
        }
    }
}
exports.default = new CollectionsProductsController();

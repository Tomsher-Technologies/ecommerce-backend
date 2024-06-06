"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const helpers_1 = require("../../../utils/helpers");
const brand_schema_1 = require("../../../utils/schemas/admin/ecommerce/brand-schema");
const multi_languages_1 = require("../../../constants/multi-languages");
const task_log_1 = require("../../../constants/admin/task-log");
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const brands_service_1 = __importDefault(require("../../../services/admin/ecommerce/brands-service"));
const brands_model_1 = __importDefault(require("../../../model/admin/ecommerce/brands-model"));
const general_service_1 = __importDefault(require("../../../services/admin/general-service"));
const mongoose_1 = __importDefault(require("mongoose"));
const collections_brands_service_1 = __importDefault(require("../../../services/admin/website/collections-brands-service"));
const controller = new base_controller_1.default();
class BrandsController extends base_controller_1.default {
    async findAll(req, res) {
        try {
            const { _id, unCollectionedBrands, page_size = 1, limit = '', status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '', brandId = '' } = req.query;
            let query = { _id: { $exists: true } };
            let brand;
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
                        { brandTitle: keywordRegex }
                    ],
                    ...query
                };
            }
            if (_id) {
                if (typeof _id === 'string') {
                    query = {
                        ...query, _id: new mongoose_1.default.Types.ObjectId(_id)
                    };
                }
                else {
                    const brandIds = _id.map((id) => new mongoose_1.default.Types.ObjectId(id));
                    brand = {
                        _id: { $in: brandIds }
                    };
                }
            }
            if (brand && (Object.keys(brand)).length > 0) {
                query = {
                    ...query, ...brand
                };
            }
            if (brandId) {
                query = {
                    ...query, _id: new mongoose_1.default.Types.ObjectId(brandId)
                };
            }
            const keysToCheck = ['corporateGiftsPriority', 'brandListPriority'];
            const filteredQuery = keysToCheck.reduce((result, key) => {
                if (key in req.query) {
                    result[key] = req.query[key];
                }
                return result;
            }, {});
            let filteredPriorityQuery = {};
            if (Object.keys(filteredQuery).length > 0) {
                for (const key in filteredQuery) {
                    if (filteredQuery[key] === '> 0') {
                        filteredPriorityQuery[key] = { $gt: '0' }; // Set query for key greater than 0
                    }
                    else if (filteredQuery[key] === '0') {
                        filteredPriorityQuery[key] = '0'; // Set query for key equal to 0
                    }
                    else if (filteredQuery[key] === '< 0' || filteredQuery[key] === null || filteredQuery[key] === undefined) {
                        filteredPriorityQuery[key] = { $lt: '0' }; // Set query for key less than 0
                    }
                }
            }
            if (unCollectionedBrands) {
                const collection = await collections_brands_service_1.default.findOne(unCollectionedBrands);
                // console.log('collection', collection, unCollectionedBrands);
                if (collection) {
                    const unCollectionedBrandIds = collection.collectionsBrands.map(id => new mongoose_1.default.Types.ObjectId(id));
                    if (unCollectionedBrandIds.length > 0) {
                        query._id = { $nin: unCollectionedBrandIds };
                        query.status = '1';
                    }
                }
            }
            query = { ...query, ...filteredPriorityQuery };
            const sort = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const brands = await brands_service_1.default.findAll({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort
            });
            return controller.sendSuccessResponse(res, {
                requestedData: brands,
                totalCount: await brands_service_1.default.getTotalCount(query),
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching brands' });
        }
    }
    async create(req, res) {
        try {
            const validatedData = brand_schema_1.brandSchema.safeParse(req.body);
            // console.log('req', req.file);
            if (validatedData.success) {
                const { brandTitle, slug, description, metaTitle, metaDescription, ogTitle, ogDescription, metaImage, twitterTitle, twitterDescription, languageValues, status } = validatedData.data;
                const user = res.locals.user;
                const brandImage = req.files.find((file) => file.fieldname === 'brandImage');
                const brandBannerImage = req.files.find((file) => file.fieldname === 'brandBannerImage');
                const brandData = {
                    brandTitle,
                    slug: slug || (0, helpers_1.slugify)(brandTitle),
                    brandImageUrl: (0, helpers_1.handleFileUpload)(req, null, (req.file || brandImage), 'brandImageUrl', 'brand'),
                    brandBannerImageUrl: (0, helpers_1.handleFileUpload)(req, null, (req.file || brandBannerImage), 'brandBannerImageUrl', 'brand'),
                    description,
                    metaTitle: metaTitle,
                    metaDescription: metaDescription,
                    ogTitle: ogTitle,
                    ogDescription: ogDescription,
                    metaImageUrl: metaImage,
                    twitterTitle: twitterTitle,
                    twitterDescription: twitterDescription,
                    ['status']: status || '1',
                    statusAt: new Date(),
                    createdBy: user._id,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                const newBrand = await brands_service_1.default.create(brandData);
                // const fetchedBrand = await BrandsService.findOne(newBrand._id);
                if (newBrand) {
                    const languageValuesImages = req.files.filter((file) => file.fieldname &&
                        file.fieldname.startsWith('languageValues[') &&
                        file.fieldname.includes('[brandImage]'));
                    const languageValuesBannerImages = req.files.filter((file) => file.fieldname &&
                        file.fieldname.startsWith('languageValues[') &&
                        file.fieldname.includes('[brandBannerImage]'));
                    if (languageValues && Array.isArray(languageValues) && languageValues.length > 0) {
                        await languageValues?.map((languageValue, index) => {
                            let brandImageUrl = '';
                            if (languageValuesImages.length > 0) {
                                brandImageUrl = (0, helpers_1.handleFileUpload)(req, null, languageValuesImages[index], `brandImageUrl`, 'brand');
                            }
                            let brandBannerImageUrl = '';
                            if (languageValuesBannerImages.length > 0) {
                                brandBannerImageUrl = (0, helpers_1.handleFileUpload)(req, null, languageValuesBannerImages[index], `brandBannerImageUrl`, 'brand');
                            }
                            const languageValues = general_service_1.default.multiLanguageFieledsManage(newBrand._id, {
                                ...languageValue,
                                languageValues: {
                                    ...languageValue.languageValues,
                                    brandImageUrl,
                                    brandBannerImageUrl
                                }
                            });
                        });
                    }
                    return controller.sendSuccessResponse(res, {
                        requestedData: {
                            ...newBrand,
                            languageValues: languageValues
                        },
                        message: 'Brand created successfully!'
                    }, 200, {
                        sourceFromId: newBrand._id,
                        sourceFrom: task_log_1.adminTaskLog.ecommerce.brands,
                        activity: task_log_1.adminTaskLogActivity.create,
                        activityStatus: task_log_1.adminTaskLogStatus.success
                    });
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Error',
                        validation: 'Something went wrong! brand cant be inserted. please try again'
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
            if (error && error.errors && error.errors.brandTitle && error.errors.brandTitle.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        brandTitle: error.errors.brandTitle.properties.message
                    }
                }, req);
            }
            else if (error && error.errors && error.errors.brandImageUrl && error.errors.brandImageUrl.properties) {
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
    async findOne(req, res) {
        try {
            const brandId = req.params.id;
            if (brandId) {
                const brand = await brands_service_1.default.findOne(brandId);
                return controller.sendSuccessResponse(res, {
                    requestedData: brandId,
                    message: 'Success'
                });
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Brand Id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
    async update(req, res) {
        try {
            const validatedData = brand_schema_1.brandSchema.safeParse(req.body);
            if (validatedData.success) {
                const brandId = req.params.id;
                if (brandId) {
                    const brandImage = req.files.find((file) => file.fieldname === 'brandImage');
                    const brandBannerImage = req.files.find((file) => file.fieldname === 'brandBannerImage');
                    let updatedBrandData = req.body;
                    updatedBrandData = {
                        ...updatedBrandData,
                        brandImageUrl: (0, helpers_1.handleFileUpload)(req, await brands_service_1.default.findOne(brandId), (req.file || brandImage), 'brandImageUrl', 'brand'),
                        brandBannerImageUrl: (0, helpers_1.handleFileUpload)(req, await brands_service_1.default.findOne(brandId), (req.file || brandBannerImage), 'brandBannerImageUrl', 'brand'),
                        updatedAt: new Date()
                    };
                    const updatedBrand = await brands_service_1.default.update(brandId, updatedBrandData);
                    if (updatedBrand) {
                        const languageValuesImages = req.files.filter((file) => file.fieldname &&
                            file.fieldname.startsWith('languageValues[') &&
                            file.fieldname.includes('[brandImage]'));
                        const languageValuesBannerImages = req.files.filter((file) => file.fieldname &&
                            file.fieldname.startsWith('languageValues[') &&
                            file.fieldname.includes('[brandBannerImage]'));
                        let newLanguageValues = [];
                        if (updatedBrandData.languageValues && updatedBrandData.languageValues.length > 0) {
                            for (let i = 0; i < updatedBrandData.languageValues.length; i++) {
                                const languageValue = updatedBrandData.languageValues[i];
                                let brandImageUrl = '';
                                let brandBannerImageUrl = '';
                                const matchingImage = languageValuesImages.find((image) => image.fieldname.includes(`languageValues[${i}]`));
                                if (languageValuesImages.length > 0 && matchingImage) {
                                    const existingLanguageValues = await general_service_1.default.findOneLanguageValues(multi_languages_1.multiLanguageSources.ecommerce.brands, updatedBrand._id, languageValue.languageId);
                                    brandImageUrl = await (0, helpers_1.handleFileUpload)(req, existingLanguageValues.languageValues, matchingImage, `brandImageUrl`, 'brand');
                                }
                                else {
                                    brandImageUrl = updatedBrandData.languageValues[i].languageValues?.brandImageUrl;
                                }
                                const matchingBannerImage = languageValuesBannerImages.find((image) => image.fieldname.includes(`languageValues[${i}]`));
                                if (languageValuesBannerImages.length > 0 && matchingBannerImage) {
                                    const existingLanguageValues = await general_service_1.default.findOneLanguageValues(multi_languages_1.multiLanguageSources.ecommerce.brands, updatedBrand._id, languageValue.languageId);
                                    brandBannerImageUrl = await (0, helpers_1.handleFileUpload)(req, existingLanguageValues.languageValues, matchingBannerImage, `brandBannerImageUrl`, 'brand');
                                }
                                else {
                                    brandBannerImageUrl = updatedBrandData.languageValues[i].languageValues?.brandBannerImageUrl;
                                }
                                const languageValues = await general_service_1.default.multiLanguageFieledsManage(updatedBrand._id, {
                                    ...languageValue,
                                    languageValues: {
                                        ...languageValue.languageValues,
                                        brandImageUrl
                                    }
                                });
                                newLanguageValues.push(languageValues);
                            }
                        }
                        const updatedBrandMapped = Object.keys(updatedBrand).reduce((mapped, key) => {
                            mapped[key] = updatedBrand[key];
                            return mapped;
                        }, {});
                        return controller.sendSuccessResponse(res, {
                            requestedData: {
                                ...updatedBrandMapped,
                                languageValues: newLanguageValues
                            },
                            message: 'Brand updated successfully!'
                        }, 200, {
                            sourceFromId: updatedBrandMapped._id,
                            sourceFrom: task_log_1.adminTaskLog.ecommerce.brands,
                            activity: task_log_1.adminTaskLogActivity.update,
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Brand Id not found!',
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Brand Id not found! Please try again with brand id',
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
                message: error.message || 'Some error occurred while updating brand'
            }, req);
        }
    }
    async statusChange(req, res) {
        try {
            const validatedData = brand_schema_1.brandStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const brandId = req.params.id;
                if (brandId) {
                    let { status } = req.body;
                    const updatedBrandData = { status };
                    const updatedBrand = await brands_service_1.default.update(brandId, updatedBrandData);
                    if (updatedBrand) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedBrand,
                            message: 'Brand status updated successfully!'
                        }, 200, {
                            sourceFromId: brandId,
                            sourceFrom: task_log_1.adminTaskLog.ecommerce.brands,
                            activity: task_log_1.adminTaskLogActivity.delete,
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Brand Id not found!',
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Brand Id not found! Please try again with brand id',
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
                message: error.message || 'Some error occurred while updating brand'
            }, req);
        }
    }
    async destroy(req, res) {
        try {
            const brandId = req.params.id;
            if (brandId) {
                const brand = await brands_service_1.default.findOne(brandId);
                if (brandId) {
                    // await BrandsService.destroy(brandId);
                    //  controller.sendSuccessResponse(res, { message: 'Brand deleted successfully!' });
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Cant to be delete brand!',
                    });
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'This Brand details not found!',
                    });
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Brand id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting brand' });
        }
    }
    async updateWebsitePriority(req, res) {
        try {
            const validatedData = brand_schema_1.updateWebsitePrioritySchema.safeParse(req.body);
            if (validatedData.success) {
                const { keyColumn, root, container1 } = validatedData.data;
                const validKeys = ['corporateGiftsPriority', 'brandListPriority'];
                if (validKeys.includes(keyColumn)) {
                    let updatedBrandData = req.body;
                    updatedBrandData = {
                        ...updatedBrandData,
                        updatedAt: new Date()
                    };
                    await brands_service_1.default.updateWebsitePriority(container1, keyColumn);
                    return controller.sendSuccessResponse(res, {
                        requestedData: await brands_model_1.default.find({ [keyColumn]: { $gt: '0' } }).sort({ [keyColumn]: 'asc' }),
                        message: 'Brand website priority updated successfully!'
                    }, 200, {
                        sourceFromId: '',
                        sourceFrom: task_log_1.adminTaskLog.ecommerce.brands,
                        activity: task_log_1.adminTaskLogActivity.priorityUpdation,
                        activityStatus: task_log_1.adminTaskLogStatus.success
                    });
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Invalid key column provided',
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
                message: error.message || 'Some error occurred while creating brand',
            }, req);
        }
    }
}
exports.default = new BrandsController();

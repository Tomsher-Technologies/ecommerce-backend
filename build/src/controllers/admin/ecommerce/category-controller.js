"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
require("module-alias/register");
const helpers_1 = require("../../../utils/helpers");
const category_schema_1 = require("../../../utils/schemas/admin/ecommerce/category-schema");
const task_log_1 = require("../../../constants/admin/task-log");
const multi_languages_1 = require("../../../constants/multi-languages");
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const category_service_1 = __importDefault(require("../../../services/admin/ecommerce/category-service"));
const general_service_1 = __importDefault(require("../../../services/admin/general-service"));
const category_model_1 = __importDefault(require("../../../model/admin/ecommerce/category-model"));
const collections_categories_service_1 = __importDefault(require("../../../services/admin/website/collections-categories-service"));
const seo_page_1 = require("../../../constants/admin/seo-page");
const seo_page_service_1 = __importDefault(require("../../../services/admin/seo-page-service"));
const controller = new base_controller_1.default();
class CategoryController extends base_controller_1.default {
    async findAll(req, res) {
        try {
            const { unCollectionedCategories, page_size = 1, limit = '', status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '', slug = '', category = '', categoryId = '', _id = '', parentCategory = '' } = req.query;
            let query = { _id: { $exists: true } };
            let categoryIdCheck;
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
                        { categoryTitle: keywordRegex },
                        { slug: keywordRegex },
                    ],
                    ...query
                };
            }
            if (categoryId) {
                query = {
                    ...query, _id: new mongoose_1.default.Types.ObjectId(categoryId)
                };
            }
            if (_id) {
                if (typeof _id === 'string') {
                    query = {
                        ...query, _id: new mongoose_1.default.Types.ObjectId(_id)
                    };
                }
                else {
                    const categoryIds = _id.map((id) => new mongoose_1.default.Types.ObjectId(id));
                    categoryIdCheck = {
                        _id: { $in: categoryIds }
                    };
                }
            }
            if (categoryIdCheck && (Object.keys(categoryIdCheck)).length > 0) {
                query = {
                    ...query, ...categoryIdCheck
                };
            }
            if (category) {
                query = {
                    ...query, _id: new mongoose_1.default.Types.ObjectId(category)
                };
            }
            if (slug) {
                query = {
                    ...query, slug: slug
                };
            }
            if (parentCategory) {
                query = {
                    ...query, parentCategory: new mongoose_1.default.Types.ObjectId(parentCategory)
                };
            }
            const keysToCheck = ['corporateGiftsPriority'];
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
            if (unCollectionedCategories) {
                const collection = await collections_categories_service_1.default.findOne(unCollectionedCategories);
                // console.log('collection', collection, unCollectionedCategories);
                if (collection) {
                    const unCollectionedBrandIds = collection.collectionsCategories.map(id => new mongoose_1.default.Types.ObjectId(id));
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
            const categories = await category_service_1.default.findAll({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort
            });
            controller.sendSuccessResponse(res, {
                requestedData: categories,
                totalCount: await category_service_1.default.getTotalCount(query),
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching categories' });
        }
    }
    async findAllChilledCategories(req, res) {
        try {
            const { status = '1', keyword = '', categoryId = '', parentCategory = '' } = req.query;
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
                        { categoryTitle: keywordRegex },
                        { slug: keywordRegex },
                    ],
                    ...query
                };
            }
            if (categoryId) {
                query = { _id: categoryId };
            }
            if (!parentCategory && keyword === '' && categoryId === '') {
                query.$or = [
                    { parentCategory: null },
                    { parentCategory: { $exists: false } }
                ];
            }
            else if (parentCategory) {
                query.parentCategory = parentCategory;
            }
            const categories = await category_service_1.default.findAllChilledCategories(query);
            controller.sendSuccessResponse(res, {
                requestedData: categories,
                totalCount: await category_service_1.default.getTotalCount(query),
                message: 'Success!ddd'
            }, 200);
        }
        catch (error) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching categories' });
        }
    }
    async findAllParentCategories(req, res) {
        try {
            const { status = '1', categoryId = '' } = req.query;
            let query = { _id: { $exists: true } };
            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            }
            else {
                query.status = '1';
            }
            if (categoryId) {
                query._id = categoryId;
            }
            else {
                query._id = { $exists: true };
            }
            const categories = await category_service_1.default.findAllParentCategories({ query });
            controller.sendSuccessResponse(res, {
                requestedData: categories,
                totalCount: await category_service_1.default.getTotalCount(query),
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching categories' });
        }
    }
    async create(req, res) {
        try {
            const validatedData = category_schema_1.categorySchema.safeParse(req.body);
            if (validatedData.success) {
                const { categoryTitle, slug, description, corporateGiftsPriority, type, level, parentCategory, seoData, metaTitle, metaKeywords, metaDescription, ogTitle, ogDescription, metaImage, twitterTitle, twitterDescription, languageValues, status } = validatedData.data;
                const user = res.locals.user;
                const category = parentCategory ? await category_service_1.default.findParentCategory(parentCategory) : null;
                var slugData;
                var data = [];
                if (!parentCategory) {
                    data = (0, helpers_1.categorySlugifyManually)(categoryTitle);
                }
                else {
                    data = category?.slug + "-" + (0, helpers_1.categorySlugifyManually)(categoryTitle);
                }
                slugData = data;
                const categoryImage = (req?.file) || req.files.find((file) => file.fieldname === 'categoryImage');
                const categoryData = {
                    categoryTitle: (0, helpers_1.capitalizeWords)(categoryTitle),
                    slug: slugData || slug,
                    categoryImageUrl: (0, helpers_1.handleFileUpload)(req, null, (req.file || categoryImage), 'categoryImageUrl', 'category'),
                    description,
                    corporateGiftsPriority,
                    type,
                    parentCategory: parentCategory ? parentCategory : null,
                    level: category?.level ? parseInt(category?.level) + 1 : '0',
                    createdBy: user._id,
                    metaTitle: metaTitle,
                    metaKeywords: metaKeywords,
                    metaDescription: metaDescription,
                    ogTitle: ogTitle,
                    ogDescription: ogDescription,
                    metaImageUrl: metaImage,
                    twitterTitle: twitterTitle,
                    twitterDescription: twitterDescription,
                    ['status']: status || '1',
                };
                const newCategory = await category_service_1.default.create(categoryData);
                if (newCategory) {
                    const languageValuesImages = req.files && req.files.filter((file) => file.fieldname &&
                        file.fieldname.startsWith('languageValues[') &&
                        file.fieldname.includes('[categoryImage]'));
                    if (languageValues && Array.isArray(languageValues) && languageValues?.length > 0) {
                        await languageValues?.map((languageValue, index) => {
                            let categoryImageUrl = '';
                            if (languageValuesImages?.length > 0) {
                                categoryImageUrl = (0, helpers_1.handleFileUpload)(req, null, languageValuesImages[index], `categoryImageUrl`, 'category');
                            }
                            general_service_1.default.multiLanguageFieledsManage(newCategory._id, {
                                ...languageValue,
                                source: multi_languages_1.multiLanguageSources.ecommerce.categories,
                                languageValues: {
                                    ...languageValue.languageValues,
                                    categoryImageUrl
                                }
                            });
                        });
                    }
                    if (seoData && Array.isArray(seoData) && seoData.length > 0) {
                        await seo_page_service_1.default.insertOrUpdateSeoDataWithCountryId(newCategory._id, seoData, seo_page_1.seoPage.ecommerce.categories);
                    }
                    return controller.sendSuccessResponse(res, {
                        requestedData: newCategory,
                        message: 'Category created successfully!'
                    }, 200, {
                        sourceFromId: newCategory._id,
                        sourceFrom: task_log_1.adminTaskLog.ecommerce.categories,
                        activity: task_log_1.adminTaskLogActivity.create,
                        activityStatus: task_log_1.adminTaskLogStatus.success
                    });
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                        validation: 'Something went wrong! category cant be inserted. please try again'
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
            if (error && error.errors && error.errors.categoryTitle && error.errors.categoryTitle.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        categoryTitle: error.errors.categoryTitle.properties.message
                    }
                }, req);
            }
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating Category',
            }, req);
        }
    }
    async findOne(req, res) {
        try {
            const categoryId = req.params.id;
            if (categoryId) {
                const category = await category_service_1.default.findOne(categoryId);
                controller.sendSuccessResponse(res, {
                    requestedData: category,
                    message: 'Success'
                });
            }
            else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Category Id not found!',
                });
            }
        }
        catch (error) {
            controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
    async update(req, res) {
        try {
            const validatedData = category_schema_1.categorySchema.safeParse(req.body);
            if (validatedData.success) {
                const categoryId = req.params.id;
                const user = res.locals.user;
                if (categoryId) {
                    const categoryImage = req.files.find((file) => file.fieldname === 'categoryImage');
                    let { seoData, ...updatedCategoryData } = req.body;
                    const updatedCategory = await category_service_1.default.findOne(categoryId);
                    updatedCategoryData = {
                        ...updatedCategoryData,
                        categoryTitle: (0, helpers_1.capitalizeWords)(updatedCategoryData.categoryTitle),
                        parentCategory: updatedCategoryData.parentCategory ? updatedCategoryData.parentCategory : null,
                        level: updatedCategoryData.level,
                        slug: updatedCategoryData.slug,
                        categoryImageUrl: (0, helpers_1.handleFileUpload)(req, await category_service_1.default.findOne(categoryId), (req.file || categoryImage), 'categoryImageUrl', 'category'),
                        updatedAt: new Date()
                    };
                    if (updatedCategory.parentCategory != updatedCategoryData.parentCategory || updatedCategoryData) {
                        const updatedSlugCategory = await category_service_1.default.update(categoryId, updatedCategoryData);
                        if (updatedSlugCategory) {
                            await category_service_1.default.findSubCategory(updatedSlugCategory);
                        }
                    }
                    if (updatedCategory) {
                        const languageValuesImages = req.files.filter((file) => file.fieldname &&
                            file.fieldname.startsWith('languageValues[') &&
                            file.fieldname.includes('[categoryImage]'));
                        let newLanguageValues = [];
                        if (updatedCategoryData.languageValues && Array.isArray(updatedCategoryData.languageValues) && updatedCategoryData.languageValues.length > 0) {
                            for (let i = 0; i < updatedCategoryData.languageValues.length; i++) {
                                const languageValue = updatedCategoryData.languageValues[i];
                                let categoryImageUrl = '';
                                const matchingImage = languageValuesImages.find((image) => image.fieldname.includes(`languageValues[${i}]`));
                                if (languageValuesImages.length > 0 && matchingImage) {
                                    const existingLanguageValues = await general_service_1.default.findOneLanguageValues(multi_languages_1.multiLanguageSources.ecommerce.categories, updatedCategory._id, languageValue.languageId);
                                    categoryImageUrl = await (0, helpers_1.handleFileUpload)(req, existingLanguageValues.languageValues, matchingImage, `categoryImageUrl`, 'category');
                                }
                                else {
                                    categoryImageUrl = updatedCategoryData.languageValues[i].languageValues?.categoryImageUrl;
                                }
                                const languageValues = await general_service_1.default.multiLanguageFieledsManage(updatedCategory._id, {
                                    ...languageValue,
                                    languageValues: {
                                        ...languageValue.languageValues,
                                        categoryImageUrl
                                    }
                                });
                                newLanguageValues.push(languageValues);
                            }
                        }
                        const updatedCategoryMapped = Object.keys(updatedCategory).reduce((mapped, key) => {
                            mapped[key] = updatedCategory[key];
                            return mapped;
                        }, {});
                        if (seoData && Array.isArray(seoData) && seoData.length > 0) {
                            await seo_page_service_1.default.insertOrUpdateSeoDataWithCountryId(updatedCategory._id, seoData, seo_page_1.seoPage.ecommerce.categories);
                        }
                        return controller.sendSuccessResponse(res, {
                            requestedData: {
                                ...updatedCategoryMapped,
                                message: 'Category updated successfully!'
                            }
                        }, 200, {
                            sourceFromId: updatedCategory._id,
                            sourceFrom: task_log_1.adminTaskLog.ecommerce.categories,
                            activity: task_log_1.adminTaskLogActivity.update,
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Category Id not found!',
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Category Id not found! Please try again with category id',
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
                message: error.message || 'Some error occurred while updating category'
            }, req);
        }
    }
    async destroy(req, res) {
        try {
            const categoryId = req.params.id;
            if (categoryId) {
                const category = await category_service_1.default.findOne(categoryId);
                if (category) {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Cant to be delete category!!',
                    });
                    // await CategoryService.destroy(categoryId);
                    // controller.sendSuccessResponse(res, { message: 'Category deleted successfully!' });
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'This Category details not found!',
                    });
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Category id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting category' });
        }
    }
    async getParentChilledCategory(req, res) {
        try {
            const { page = 1, limit = 10, status = '1' } = req.query;
            const query = { status, _id: { $exists: true } };
            const categories = await category_service_1.default.findAll({ page: parseInt(page), limit: parseInt(limit), query });
            controller.sendSuccessResponse(res, {
                requestedData: categories,
                totalCount: await category_service_1.default.getTotalCount(query),
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching categories' });
        }
    }
    async updateWebsitePriority(req, res) {
        try {
            const validatedData = category_schema_1.updateWebsitePrioritySchema.safeParse(req.body);
            if (validatedData.success) {
                const { keyColumn, root, container1 } = validatedData.data;
                const validKeys = ['corporateGiftsPriority'];
                if (validKeys.includes(keyColumn)) {
                    let updatedCategoryData = req.body;
                    updatedCategoryData = {
                        ...updatedCategoryData,
                        updatedAt: new Date()
                    };
                    await category_service_1.default.updateWebsitePriority(container1, keyColumn);
                    return controller.sendSuccessResponse(res, {
                        requestedData: await category_model_1.default.find({ [keyColumn]: { $gt: '0' } }).sort({ [keyColumn]: 'asc' }),
                        message: 'Category website priority updated successfully!'
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
                message: error.message || 'Some error occurred while creating category',
            }, req);
        }
    }
    async statusChange(req, res) {
        try {
            const validatedData = category_schema_1.categoryStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const categoryId = req.params.id;
                if (categoryId) {
                    let { status } = req.body;
                    const updatedCategoryData = { status };
                    const updatedCategory = await category_service_1.default.update(categoryId, updatedCategoryData);
                    if (updatedCategory) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedCategory,
                            message: 'Category status updated successfully!'
                        });
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Category Id not found!',
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Category Id not found! Please try again with Category id',
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
                message: error.message || 'Some error occurred while updating Category'
            }, req);
        }
    }
}
exports.default = new CategoryController();

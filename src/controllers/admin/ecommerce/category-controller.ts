import { Request, Response } from 'express';
import mongoose from 'mongoose';
import 'module-alias/register';

import { capitalizeWords, categorySlugifyManually, formatZodError, handleFileUpload } from '../../../utils/helpers';
import { categorySchema, updateWebsitePrioritySchema, categoryStatusSchema } from '../../../utils/schemas/admin/ecommerce/category-schema';
import { CategoryQueryParams } from '../../../utils/types/category';
import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from '../../../constants/admin/task-log';
import { multiLanguageSources } from '../../../constants/multi-languages';

import BaseController from '../../../controllers/admin/base-controller';
import CategoryService from '../../../services/admin/ecommerce/category-service'
import GeneralService from '../../../services/admin/general-service';
import CategoryModel, { CategoryProps } from '../../../model/admin/ecommerce/category-model';
import CollectionsCategoriesService from '../../../services/admin/website/collections-categories-service';
import { seoPage } from '../../../constants/admin/seo-page';
import SeoPageService from '../../../services/admin/seo-page-service';
import { collections } from '../../../constants/collections';

const controller = new BaseController();

class CategoryController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { unCollectionedCategories, page_size = 1, limit = '', status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '', slug = '', category = '', categoryId = '', _id = '', parentCategory = '' } = req.query as CategoryQueryParams;

            let query: any = { _id: { $exists: true } };
            let categoryIdCheck: any

            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            } else {
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
                } as any;
            }

            if (categoryId) {
                query = {
                    ...query, _id: new mongoose.Types.ObjectId(categoryId)
                } as any;
            }

            if (_id) {
                if (typeof _id === 'string') {
                    query = {
                        ...query, _id: new mongoose.Types.ObjectId(_id)
                    } as any;
                } else {
                    const categoryIds = _id.map((id: any) => new mongoose.Types.ObjectId(id));
                    categoryIdCheck = {
                        _id: { $in: categoryIds }
                    };
                }
            }
            if (categoryIdCheck && (Object.keys(categoryIdCheck)).length > 0) {
                query = {
                    ...query, ...categoryIdCheck
                } as any;
            }
            if (category) {
                query = {
                    ...query, _id: new mongoose.Types.ObjectId(category)
                } as any;
            }
            if (slug) {
                query = {
                    ...query, slug: slug
                } as any;
            }

            if (parentCategory) {
                query = {
                    ...query, parentCategory: new mongoose.Types.ObjectId(parentCategory)
                } as any;
            }

            const keysToCheck: (keyof CategoryProps)[] = ['corporateGiftsPriority'];
            const filteredQuery = keysToCheck.reduce((result: any, key) => {
                if (key in req.query) {
                    result[key] = req.query[key];
                }
                return result;
            }, {} as Partial<CategoryQueryParams>);
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

            if (unCollectionedCategories) {
                const collection = await CollectionsCategoriesService.findOne(unCollectionedCategories);
                // console.log('collection', collection, unCollectionedCategories);

                if (collection) {
                    const unCollectionedBrandIds = collection.collectionsCategories.map(id => new mongoose.Types.ObjectId(id));
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

            const categories = await CategoryService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            controller.sendSuccessResponse(res, {
                requestedData: categories,
                totalCount: await CategoryService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching categories' });
        }
    }

    async findAllChilledCategories(req: Request, res: Response): Promise<void> {
        try {
            const { status = '1', keyword = '', categoryId = '', parentCategory = '' } = req.query as CategoryQueryParams;
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
                        { categoryTitle: keywordRegex },
                        { slug: keywordRegex },
                    ],
                    ...query

                } as any;
            }

            if (categoryId) {
                query = { _id: categoryId }
            }

            if (!parentCategory && keyword === '' && categoryId === '') {
                query.$or = [
                    { parentCategory: null },
                    { parentCategory: { $exists: false } }
                ];
            } else if (parentCategory) {
                query.parentCategory = parentCategory;
            }
            const categories = await CategoryService.findAllChilledCategories(query);

            controller.sendSuccessResponse(res, {
                requestedData: categories,
                totalCount: await CategoryService.getTotalCount(query),
                message: 'Success!ddd'
            }, 200);
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching categories' });
        }
    }

    async findAllParentCategories(req: Request, res: Response): Promise<void> {
        try {
            const { status = '1', categoryId = '' } = req.query;
            let query: any = { _id: { $exists: true } };
            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            } else {
                query.status = '1';
            }

            if (categoryId) {
                query._id = categoryId as string;
            } else {
                query._id = { $exists: true };
            }
            const categories = await CategoryService.findAllParentCategories({ query });

            controller.sendSuccessResponse(res, {
                requestedData: categories,
                totalCount: await CategoryService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching categories' });
        }
    }


    async create(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = categorySchema.safeParse(req.body);
            if (validatedData.success) {
                const { categoryTitle, slug, description, corporateGiftsPriority, type, level, parentCategory, seoData, metaTitle, metaKeywords, metaDescription, ogTitle, ogDescription, metaImage, twitterTitle, twitterDescription, languageValues, status } = validatedData.data;
                const user = res.locals.user;
                const category = parentCategory ? await CategoryService.findParentCategory(parentCategory) : null;
                var slugData
                var data: any = []
                if (!parentCategory) {
                    data = categorySlugifyManually(categoryTitle)
                }
                else {
                    data = category?.slug + "-" + categorySlugifyManually(categoryTitle)
                }
                slugData = data
                const categoryImage = (req?.file) || (req as any).files.find((file: any) => file.fieldname === 'categoryImage');
                const categorySecondImage = (req?.file) || (req as any).files.find((file: any) => file.fieldname === 'categorySecondImage');
                const categoryData = {
                    categoryTitle: capitalizeWords(categoryTitle),
                    slug: slugData || slug,
                    categoryImageUrl: handleFileUpload(req, null, (req.file || categoryImage), 'categoryImageUrl', 'category'),
                    categorySecondImageUrl: handleFileUpload(req, null, (req.file || categorySecondImage), 'categorySecondImageUrl', 'category'),
                    description,
                    corporateGiftsPriority,
                    type,
                    parentCategory: parentCategory ? parentCategory : null,
                    level: category?.level ? parseInt(category?.level) + 1 : '0',
                    createdBy: user._id,
                    metaTitle: metaTitle as string,
                    metaKeywords: metaKeywords as string,
                    metaDescription: metaDescription as string,
                    ogTitle: ogTitle as string,
                    ogDescription: ogDescription as string,
                    metaImageUrl: metaImage as string,
                    twitterTitle: twitterTitle as string,
                    twitterDescription: twitterDescription as string,
                    ['status' as string]: status || '1',
                };
                const newCategory = await CategoryService.create(categoryData);
                if (newCategory) {
                    const languageValuesImages = (req as any).files && (req as any).files.filter((file: any) =>
                        file.fieldname &&
                        file.fieldname.startsWith('languageValues[') &&
                        file.fieldname.includes('[categoryImage]')
                    );
                    const languageValuesCategorySecondImage = (req as any).files.filter((file: any) =>
                        file.fieldname &&
                        file.fieldname.startsWith('languageValues[') &&
                        file.fieldname.includes('[categorySecondImage]')
                    );

                    if (languageValues && Array.isArray(languageValues) && languageValues?.length > 0) {
                        await languageValues?.map((languageValue: any, index: number) => {
                            let categoryImageUrl = ''
                            if (languageValuesImages?.length > 0) {
                                categoryImageUrl = handleFileUpload(req
                                    , null, languageValuesImages[index], `categoryImageUrl`, 'category');
                            }
                            let categorySecondImageUrl = ''
                            if (languageValuesCategorySecondImage.length > 0) {
                                categorySecondImageUrl = handleFileUpload(req, null, languageValuesCategorySecondImage[index], `categorySecondImageUrl`, 'category');
                            }
                            GeneralService.multiLanguageFieledsManage(newCategory._id, {
                                ...languageValue,
                                source: multiLanguageSources.ecommerce.categories,
                                languageValues: {
                                    ...languageValue.languageValues,
                                    categoryImageUrl,
                                    categorySecondImageUrl
                                }
                            })
                        })
                    }

                    if (seoData && Array.isArray(seoData) && seoData.length > 0) {
                        await SeoPageService.insertOrUpdateSeoDataWithCountryId(newCategory._id, seoData, seoPage.ecommerce.categories)
                    }

                    return controller.sendSuccessResponse(res, {
                        requestedData: newCategory,
                        message: 'Category created successfully!'
                    }, 200, {
                        userId: user._id,
                        countryId: user.countryId,
                        sourceCollection: collections.ecommerce.categories,
                        sourceFromId: newCategory._id,
                        sourceFrom: adminTaskLog.ecommerce.categories,
                        referenceData: JSON.stringify({
                            categoryTitle: newCategory.categoryTitle,
                            slug: newCategory.slug,
                        }, null, 2),
                        activity: adminTaskLogActivity.create,
                        activityComment: 'Category created successfully!',
                        activityStatus: adminTaskLogStatus.success
                    });
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                        validation: 'Something went wrong! category cant be inserted. please try again'
                    }, req);
                }

            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) {
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

    async findOne(req: Request, res: Response): Promise<void> {
        try {
            const categoryId = req.params.id;
            if (categoryId) {
                const category = await CategoryService.findOne(categoryId);
                controller.sendSuccessResponse(res, {
                    requestedData: category,
                    message: 'Success'
                });
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Category Id not found!',
                });
            }
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = categorySchema.safeParse(req.body);
            if (validatedData.success) {
                const categoryId = req.params.id;
                const user = res.locals.user;

                if (categoryId) {
                    const categoryImage = (req as any).files.find((file: any) => file.fieldname === 'categoryImage');
                    const categorySecondImage = (req?.file) || (req as any).files.find((file: any) => file.fieldname === 'categorySecondImage');
                    let { seoData, ...updatedCategoryData } = req.body;
                    const categoryDetails: any = await CategoryService.findOne(categoryId);
                    const parentCategoryDetail: any = updatedCategoryData.parentCategory != '' ? await CategoryModel.findOne({ _id: new mongoose.Types.ObjectId(updatedCategoryData.parentCategory) }) : null

                    updatedCategoryData = {
                        ...updatedCategoryData,
                        categoryTitle: capitalizeWords(updatedCategoryData.categoryTitle),
                        parentCategory: updatedCategoryData.parentCategory ? updatedCategoryData.parentCategory : null,
                        level: parentCategoryDetail ? Number(parentCategoryDetail.level) + 1 : 0,
                        slug: updatedCategoryData.slug,
                        categoryImageUrl: handleFileUpload(req, await CategoryService.findOne(categoryId), (req.file || categoryImage), 'categoryImageUrl', 'category'),
                        categorySecondImageUrl: handleFileUpload(req, await CategoryService.findOne(categoryId), (req.file || categorySecondImage), 'categorySecondImageUrl', 'category'),
                        updatedAt: new Date()
                    };

                    if (categoryDetails.parentCategory != updatedCategoryData.parentCategory || updatedCategoryData) {
                        const updatedSlugCategory: any = await CategoryService.update(categoryId, updatedCategoryData);
                        if (updatedSlugCategory) {
                            await CategoryService.findSubCategory(updatedSlugCategory)
                        }
                    }

                    if (categoryDetails) {
                        const languageValuesImages = (req as any).files.filter((file: any) =>
                            file.fieldname &&
                            file.fieldname.startsWith('languageValues[') &&
                            file.fieldname.includes('[categoryImage]')
                        );
                        const languageValuesCategorySecondImage = (req as any).files.filter((file: any) =>
                            file.fieldname &&
                            file.fieldname.startsWith('languageValues[') &&
                            file.fieldname.includes('[categorySecondImage]')
                        );
                        let newLanguageValues: any = []
                        if (updatedCategoryData.languageValues && Array.isArray(updatedCategoryData.languageValues) && updatedCategoryData.languageValues.length > 0) {
                            for (let i = 0; i < updatedCategoryData.languageValues.length; i++) {
                                const languageValue = updatedCategoryData.languageValues[i];
                                let categoryImageUrl = '';
                                let categorySecondImageUrl = '';
                                const matchingImage = languageValuesImages.find((image: any) => image.fieldname.includes(`languageValues[${i}]`));
                                if (languageValuesImages.length > 0 && matchingImage) {
                                    const existingLanguageValues = await GeneralService.findOneLanguageValues(multiLanguageSources.ecommerce.categories, categoryDetails._id, languageValue.languageId);
                                    categoryImageUrl = await handleFileUpload(req, existingLanguageValues.languageValues, matchingImage, `categoryImageUrl`, 'category');
                                } else {
                                    categoryImageUrl = updatedCategoryData.languageValues[i].languageValues?.categoryImageUrl
                                }
                                const matchingcategorySecondrImage = languageValuesCategorySecondImage.find((image: any) => image.fieldname.includes(`languageValues[${i}]`));

                                if (languageValuesCategorySecondImage.length > 0 && matchingcategorySecondrImage) {
                                    const existingLanguageValues = await GeneralService.findOneLanguageValues(multiLanguageSources.ecommerce.brands, categoryDetails._id, languageValue.languageId);
                                    categorySecondImageUrl = await handleFileUpload(req, existingLanguageValues.languageValues, matchingcategorySecondrImage, `categorySecondImageUrl`, 'brand');
                                } else {
                                    categorySecondImageUrl = updatedCategoryData.languageValues[i].languageValues?.categorySecondImageUrl
                                }
                                const languageValues = await GeneralService.multiLanguageFieledsManage(categoryDetails._id, {
                                    ...languageValue,
                                    languageValues: {
                                        ...languageValue.languageValues,
                                        categoryImageUrl,
                                        categorySecondImageUrl
                                    }
                                });
                                newLanguageValues.push(languageValues);
                            }
                        }
                        const updatedCategoryMapped = Object.keys(categoryDetails).reduce((mapped: any, key: string) => {
                            mapped[key] = categoryDetails[key];
                            return mapped;
                        }, {});
                        if (seoData && Array.isArray(seoData) && seoData.length > 0) {
                            await SeoPageService.insertOrUpdateSeoDataWithCountryId(categoryDetails._id, seoData, seoPage.ecommerce.categories)
                        }
                        return controller.sendSuccessResponse(res, {
                            requestedData: {
                                ...updatedCategoryMapped,
                                message: 'Category updated successfully!'
                            }
                        }, 200, {
                            userId: user._id,
                            countryId: user.countryId,
                            sourceCollection: collections.ecommerce.categories,
                            sourceFromId: categoryDetails._id,
                            sourceFrom: adminTaskLog.ecommerce.categories,
                            referenceData: JSON.stringify({
                                categoryTitle: updatedCategoryMapped.categoryTitle,
                                slug: updatedCategoryMapped.slug,
                            }, null, 2),
                            activity: adminTaskLogActivity.update,
                            activityComment: 'Category updated successfully!',
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Category Id not found!',
                        }, req);
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Category Id not found! Please try again with category id',
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
                message: error.message || 'Some error occurred while updating category'
            }, req);
        }
    }

    async destroy(req: Request, res: Response): Promise<void> {
        try {
            const categoryId = req.params.id;
            if (categoryId) {
                const category = await CategoryService.findOne(categoryId);
                if (category) {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Cant to be delete category!!',
                    });
                    // await CategoryService.destroy(categoryId);
                    // controller.sendSuccessResponse(res, { message: 'Category deleted successfully!' });
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'This Category details not found!',
                    });
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Category id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting category' });
        }
    }

    async getParentChilledCategory(req: Request, res: Response): Promise<void> {
        try {
            const { page = 1, limit = 10, status = '1' } = req.query;
            const query = { status, _id: { $exists: true } };
            const categories = await CategoryService.findAll({ page: parseInt(page as string), limit: parseInt(limit as string), query });

            controller.sendSuccessResponse(res, {
                requestedData: categories,
                totalCount: await CategoryService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching categories' });
        }
    }

    async updateWebsitePriority(req: Request, res: Response): Promise<void> {
        try {

            const validatedData = updateWebsitePrioritySchema.safeParse(req.body);
            if (validatedData.success) {
                const { keyColumn, root, container1 } = validatedData.data;
                const validKeys: (keyof CategoryProps)[] = ['corporateGiftsPriority'];

                if (validKeys.includes(keyColumn as keyof CategoryProps)) {
                    let updatedCategoryData = req.body;
                    updatedCategoryData = {
                        ...updatedCategoryData,
                        updatedAt: new Date()
                    };
                    await CategoryService.updateWebsitePriority(container1, keyColumn as keyof CategoryProps);

                    return controller.sendSuccessResponse(res, {
                        requestedData: await CategoryModel.find({ [keyColumn]: { $gt: '0' } }).sort({ [keyColumn]: 'asc' }),
                        message: 'Category website priority updated successfully!'
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
                message: error.message || 'Some error occurred while creating category',
            }, req);
        }
    }

    async statusChange(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = categoryStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const categoryId = req.params.id;
                if (categoryId) {
                    let { status } = req.body;
                    const updatedCategoryData = { status };
                    const user = res.locals.user;

                    const updatedCategory = await CategoryService.update(categoryId, updatedCategoryData);
                    if (updatedCategory) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedCategory,
                            message: 'Category status updated successfully!'
                        }, 200, {
                            userId: user._id,
                            countryId: user.countryId,
                            sourceCollection: collections.ecommerce.categories,
                            sourceFromId: updatedCategory._id,
                            referenceData: JSON.stringify({
                                categoryTitle: updatedCategory.categoryTitle,
                                slug: updatedCategory.slug,
                            }, null, 2),
                            sourceFrom: adminTaskLog.ecommerce.categories,
                            activity: adminTaskLogActivity.create,
                            activityComment: 'Category status updated successfully!',
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Category Id not found!',
                        }, req);
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Category Id not found! Please try again with Category id',
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
                message: error.message || 'Some error occurred while updating Category'
            }, req);
        }
    }
}

export default new CategoryController();
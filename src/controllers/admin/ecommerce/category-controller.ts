import 'module-alias/register';
import { Request, Response } from 'express';

import { formatZodError, handleFileUpload, slugify } from '../../../utils/helpers';
import { categorySchema, updateWebsitePrioritySchema, categoryStatusSchema } from '../../../utils/schemas/admin/ecommerce/category-schema';
import { CategoryQueryParams } from '../../../utils/types/category';

import BaseController from '../../../controllers/admin/base-controller';
import CategoryService from '../../../services/admin/ecommerce/category-service'
import GeneralService from '../../../services/admin/general-service';
import CategoryModel, { CategoryProps } from '../../../model/admin/ecommerce/category-model';
import { multiLanguageSources } from '../../../constants/multi-languages';
import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from '../../../constants/admin/task-log';
import mongoose from 'mongoose';


const controller = new BaseController();

class CategoryController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = '', status = ['0', '1', '2'], sortby = '', sortorder = '', keyword = '', categoryId = '', parentCategory = '' } = req.query as CategoryQueryParams;

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
                query = {
                    ...query, _id: new mongoose.Types.ObjectId(categoryId)
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
                const { categoryTitle, slug, description, corporateGiftsPriority, type, level, parentCategory, languageValues } = validatedData.data;
                const user = res.locals.user;

                // let parentCategory = validatedData.data.parentCategory;
                // if (parentCategory === '') {
                //     parentCategory = ''; // Convert empty string to null
                // }
                const category = parentCategory ? await CategoryService.findParentCategory(parentCategory) : null;
                var slugData
                var data: any = []
                if (!parentCategory) {
                    data = categoryTitle
                }
                else {
                    data = category?.slug + "-" + categoryTitle
                }
                slugData = slugify(data, '_')


                const categoryImage = (req?.file) || (req as any).files.find((file: any) => file.fieldname === 'categoryImage');

                const categoryData = {
                    categoryTitle: await GeneralService.capitalizeWords(categoryTitle),
                    slug: slugData || slug,
                    categoryImageUrl: handleFileUpload(req, null, (req.file || categoryImage), 'categoryImageUrl', 'category'),
                    description,
                    corporateGiftsPriority,
                    type,
                    parentCategory: parentCategory ? parentCategory : null,
                    level: category?.level ? parseInt(category?.level) + 1 : '0',
                    createdBy: user._id,
                };

                const newCategory = await CategoryService.create(categoryData);

                if (newCategory) {
                    const languageValuesImages = (req as any).files && (req as any).files.filter((file: any) =>
                        file.fieldname &&
                        file.fieldname.startsWith('languageValues[') &&
                        file.fieldname.includes('[categoryImage]')
                    );

                    if (languageValues && languageValues?.length > 0) {
                        await languageValues?.map((languageValue: any, index: number) => {

                            let categoryImageUrl = ''
                            if (languageValuesImages?.length > 0) {
                                categoryImageUrl = handleFileUpload(req
                                    , null, languageValuesImages[index], `categoryImageUrl`, 'category');
                            }

                            GeneralService.multiLanguageFieledsManage(newCategory._id, {
                                ...languageValue,
                                source: multiLanguageSources.ecommerce.categories,
                                languageValues: {
                                    ...languageValue.languageValues,
                                    categoryImageUrl
                                }
                            })
                        })
                    }

                    return controller.sendSuccessResponse(res, {
                        requestedData: newCategory,
                        message: 'Category created successfully!'
                    }, 200, {
                        sourceFromId: newCategory._id,
                        sourceFrom: adminTaskLog.ecommerce.categories,
                        activity: adminTaskLogActivity.create,
                        activityStatus: adminTaskLogStatus.success
                    });
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                        validation: 'Something went wrong! category cant be inserted. please try again'
                    }, req);
                }


            } else {
                console.log('res', (req as any).file);

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
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
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

                    let updatedCategoryData = req.body;

                    const updatedCategory: any = await CategoryService.findOne(categoryId);

                    updatedCategoryData = {
                        ...updatedCategoryData,
                        parentCategory: updatedCategoryData.parentCategory ? updatedCategoryData.parentCategory : null,
                        level: updatedCategoryData.level,
                        slug: updatedCategoryData.slug,
                        categoryImageUrl: handleFileUpload(req, await CategoryService.findOne(categoryId), (req.file || categoryImage), 'categoryImageUrl', 'category'),
                        updatedAt: new Date()
                    };

                    if (updatedCategory.parentCategory != updatedCategoryData.parentCategory || updatedCategoryData) {

                        const updatedSlugCategory: any = await CategoryService.update(categoryId, updatedCategoryData);
                        if (updatedSlugCategory) {
                            await CategoryService.findSubCategory(updatedSlugCategory)
                        }
                    }

                    if (updatedCategory) {

                        const languageValuesImages = (req as any).files.filter((file: any) =>
                            file.fieldname &&
                            file.fieldname.startsWith('languageValues[') &&
                            file.fieldname.includes('[categoryImage]')
                        );

                        let newLanguageValues: any = []
                        if (updatedCategoryData.languageValues && updatedCategoryData.languageValues.length > 0) {
                            for (let i = 0; i < updatedCategoryData.languageValues.length; i++) {
                                const languageValue = updatedCategoryData.languageValues[i];
                                let categoryImageUrl = '';
                                const matchingImage = languageValuesImages.find((image: any) => image.fieldname.includes(`languageValues[${i}]`));

                                if (languageValuesImages.length > 0 && matchingImage) {
                                    const existingLanguageValues = await GeneralService.findOneLanguageValues(multiLanguageSources.ecommerce.categories, updatedCategory._id, languageValue.languageId);
                                    categoryImageUrl = await handleFileUpload(req, existingLanguageValues.languageValues, matchingImage, `categoryImageUrl`, 'category');
                                } else {
                                    categoryImageUrl = updatedCategoryData.languageValues[i].languageValues?.categoryImageUrl
                                }

                                const languageValues = await GeneralService.multiLanguageFieledsManage(updatedCategory._id, {
                                    ...languageValue,
                                    languageValues: {
                                        ...languageValue.languageValues,
                                        categoryImageUrl
                                    }
                                });
                                newLanguageValues.push(languageValues);
                            }
                        }

                        const updatedCategoryMapped = Object.keys(updatedCategory).reduce((mapped: any, key: string) => {
                            mapped[key] = updatedCategory[key];
                            return mapped;
                        }, {});


                        controller.sendSuccessResponse(res, {
                            requestedData: {
                                ...updatedCategoryMapped,
                                message: 'Category updated successfully!'
                            }
                        }, 200, {
                            sourceFromId: updatedCategory._id,
                            sourceFrom: adminTaskLog.ecommerce.categories,
                            activity: adminTaskLogActivity.update,
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        controller.sendErrorResponse(res, 200, {
                            message: 'Category Id not found!',
                        }, req);
                    }
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Category Id not found! Please try again with category id',
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
                    controller.sendErrorResponse(res, 200, {
                        message: 'Cant to be delete category!!',
                    });
                    // await CategoryService.destroy(categoryId);
                    // controller.sendSuccessResponse(res, { message: 'Category deleted successfully!' });
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'This Category details not found!',
                    });
                }
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Category id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting category' });
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

                    const updatedCategory = await CategoryService.update(categoryId, updatedCategoryData);
                    if (updatedCategory) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedCategory,
                            message: 'Category status updated successfully!'
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
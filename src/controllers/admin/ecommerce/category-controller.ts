import 'module-alias/register';
import { Request, Response } from 'express';

import { formatZodError, handleFileUpload, slugify } from '@utils/helpers';
import { categorySchema, updateWebsitePrioritySchema } from '@utils/schemas/admin/ecommerce/category-schema';
import { QueryParams } from '@utils/types/common';
import { CategoryQueryParams } from '@utils/types/category';

import BaseController from '@controllers/admin/base-controller';
import CategoryService from '@services/admin/ecommerce/category-service'
import CategoryModel, { CategoryProps } from '@model/admin/ecommerce/category-model';

const controller = new BaseController();

class CategoryController extends BaseController {

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
                        { categoryTitle: keywordRegex },
                    ],
                    ...query
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
                        filteredPriorityQuery[key] = { $gt: 0 }; // Set query for key greater than 0
                    } else if (filteredQuery[key] === '0') {
                        filteredPriorityQuery[key] = 0; // Set query for key equal to 0
                    } else if (filteredQuery[key] === '< 0' || filteredQuery[key] === null || filteredQuery[key] === undefined) {
                        filteredPriorityQuery[key] = { $lt: 0 }; // Set query for key less than 0
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

    async findAllParentCategories(req: Request, res: Response): Promise<void> {
        try {
            const { status = '1' } = req.query;
            const query = { status, _id: { $exists: true } };
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
            // console.log('req', req.file);

            if (validatedData.success) {
                const { categoryTitle, slug, description, parentCategory, type, pageTitle } = validatedData.data;
                const user = res.locals.user;

                // let parentCategory = validatedData.data.parentCategory;
                // if (parentCategory === '') {
                //     parentCategory = ''; // Convert empty string to null
                // }

                const categoryData = {
                    categoryTitle,
                    slug: slug || slugify(categoryTitle),
                    categoryImageUrl: handleFileUpload(req, null, req.file, 'categoryImageUrl', 'category'),
                    description,
                    parentCategory,
                    type,
                    pageTitle,
                    status: '1',
                    createdBy: user._id,
                    createdAt: new Date()
                };
                const newCategory = await CategoryService.create(categoryData);
                return controller.sendSuccessResponse(res, {
                    requestedData: newCategory,
                    message: 'Category created successfully!'
                });
            } else {
                console.log('res', (req as any).file);

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
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = categorySchema.safeParse(req.body);
            if (validatedData.success) {
                const categoryId = req.params.id;
                if (categoryId) {
                    let updatedCategoryData = req.body;
                    updatedCategoryData = {
                        ...updatedCategoryData,
                        categoryImageUrl: handleFileUpload(req, await CategoryService.findOne(categoryId), req.file, 'categoryImageUrl', 'category'),
                        updatedAt: new Date()
                    };

                    const updatedCategory = await CategoryService.update(categoryId, updatedCategoryData);
                    if (updatedCategory) {
                        controller.sendSuccessResponse(res, {
                            requestedData: updatedCategory,
                            message: 'Category updated successfully!'
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
                    await CategoryService.destroy(categoryId);
                    controller.sendSuccessResponse(res, { message: 'Category deleted successfully!' });
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

}

export default new CategoryController();
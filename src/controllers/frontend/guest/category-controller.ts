import mongoose from 'mongoose';
import { Request, Response } from 'express';

import BaseController from '../../../controllers/admin/base-controller';
import CategoryService from '../../../services/frontend/guest/category-service'
import CommonService from '../../../services/frontend/guest/common-service'
import { CategoryQueryParams } from '../../../utils/types/category';
const controller = new BaseController();

class CategoryController extends BaseController {
    async findAllCategory(req: Request, res: Response): Promise<void> {
        try {
            const { category = '', sortby = 'categoryTitle', sortorder = 'asc' } = req.query as CategoryQueryParams;
            const level = '0';
            let query: any = { _id: { $exists: true } };
            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));

            if (countryId) {
                const sort: any = {};
                if (sortby && sortorder) {
                    sort[sortby] = sortorder === 'desc' ? -1 : 1;
                }
                query.status = '1';
                if (category) {
                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
                    if (isObjectId) {
                        query = {
                            ...query, _id: new mongoose.Types.ObjectId(category)
                        }
                    } else {
                        query = {
                            ...query, slug: category
                        }
                    }
                }
                else {
                    query = {
                        ...query, level: level
                    } as any;
                }

                const categories = await CategoryService.findAll({
                    hostName: req.get('origin'),
                    query,
                    sort
                });

                return controller.sendSuccessResponse(res, {
                    requestedData: categories,
                    message: 'Success!'
                }, 200);
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'Country is missing'
                }, req);
            }
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching categories' });
        }
    }

    async findOne(req: Request, res: Response): Promise<void> {
        try {
            const categoryId = req.params.slug;
            if (categoryId) {
                const category = await CategoryService.findOne(categoryId, req.get('origin'));
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

}
export default new CategoryController();
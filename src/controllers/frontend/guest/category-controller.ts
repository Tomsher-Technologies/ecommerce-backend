import mongoose from 'mongoose';
import { Request, Response } from 'express';

import BaseController from '../../../controllers/admin/base-controller';
import CategoryService from '../../../services/frontend/guest/category-service'
import { CategoryQueryParams } from '../../../utils/types/category';
const controller = new BaseController();

class CategoryController extends BaseController {
    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { slug = '', category = '' } = req.query as CategoryQueryParams;
            const level = '0';
            let query: any = { _id: { $exists: true } };

            query.status = '1';

            if (slug) {
                const keywordRegex = new RegExp(slug, 'i');
                query = {
                    $or: [
                        { slug: keywordRegex },
                    ],
                    ...query
                } as any;
            }

            if (category) {
                query = {
                    ...query, parentCategory: new mongoose.Types.ObjectId(category)
                } as any;
            } else
                if (level) {
                    query = {
                        ...query, level: level
                    } as any;
                }

            const categories = await CategoryService.findAll({
                hostName: req.get('host'),
                query,
            });

            return controller.sendSuccessResponse(res, {
                requestedData: categories,
                message: 'Success!'
            }, 200);

        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching categories' });
        }
    }

}
export default new CategoryController();
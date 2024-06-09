import mongoose from 'mongoose';
import { Request, Response } from 'express';

import BaseController from '../../../controllers/admin/base-controller';
import BrandService from '../../../services/frontend/guest/brand-service'
import { BrandQueryParams } from '../../../utils/types/brands';
const controller = new BaseController();

class BrandController extends BaseController {
    async findAllBrand(req: Request, res: Response): Promise<void> {
        try {
            const { category = '', brand = '' } = req.query as BrandQueryParams;
            let query: any = { _id: { $exists: true } };

            query.status = '1';
            if (category) {

                const keywordRegex = new RegExp(category, 'i');

                const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);

                if (isObjectId) {
                    query = {
                        ...query, "productCategory.category._id": new mongoose.Types.ObjectId(category)
                    }

                } else {
                    query = {
                        ...query, "productCategory.category.slug": keywordRegex
                    }
                }
            }
           
            if (brand) {

                const keywordRegex = new RegExp(brand, 'i');

                const isObjectId = /^[0-9a-fA-F]{24}$/.test(brand);

                if (isObjectId) {
                    query = {
                        ...query, "brand._id": new mongoose.Types.ObjectId(brand)
                    }

                } else {
                    query = {
                        ...query, "brand.slug": keywordRegex
                    }
                }
            }
            const brands = await BrandService.findAll({
                hostName: req.get('host'),
                query,
            });
console.log(query);

            return controller.sendSuccessResponse(res, {
                requestedData: brands,
                message: 'Success!'
            }, 200);

        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching brands' });
        }
    }

}
export default new BrandController();
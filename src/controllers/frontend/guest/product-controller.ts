import mongoose from 'mongoose';
import { Request, Response } from 'express';

import BaseController from '../../admin/base-controller';
import ProductService from '../../../services/frontend/guest/product-service'
import { QueryParams } from '../../../utils/types/common';
import { getCountryId } from '../../../utils/helpers';
import { ProductsFrontendQueryParams, ProductsQueryParams } from '../../../utils/types/products';
import { filterProduct } from '../../../utils/admin/products';
import AttributeDetailModel from '../../../model/admin/ecommerce/attribute-detail-model';
const controller = new BaseController();

class ProductController extends BaseController {
    async findAllAttributes(req: Request, res: Response): Promise<void> {
        try {
            const {  specification = '', specificationDetail = '', product = '', category = '', attribute = '', attributeDetail = '', brand = '' } = req.query as ProductsFrontendQueryParams;
            const userData = await res.locals.user;
            const countryId = getCountryId(userData);
            let query: any = { _id: { $exists: true } };

            query.status = '1';

            if (category) {
                const keywordRegex = new RegExp(category, 'i');
                var condition

                const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
                
                if (isObjectId) {
                    condition = { parentCategory: new mongoose.Types.ObjectId(category) }

                } else {
                    condition = { slug: keywordRegex }
                }

                query = {
                    $or: [
                        condition
                    ],
                    ...query

                } as any;

            }           

            const products: any = await ProductService.findAllAttributes({
                hostName: req.get('host'),
                query,
            });

            if (products) {
               

            }

            return controller.sendSuccessResponse(res, {
                requestedData: products,
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching attributes' });
        }
    }

}
export default new ProductController();
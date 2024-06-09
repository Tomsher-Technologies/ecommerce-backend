import mongoose from 'mongoose';
import { Request, Response } from 'express';

import BaseController from '../../admin/base-controller';
import ProductService from '../../../services/frontend/guest/product-service'
import { ProductsFrontendQueryParams, ProductsQueryParams } from '../../../utils/types/products';
const controller = new BaseController();

class ProductController extends BaseController {
    async findAllAttributes(req: Request, res: Response): Promise<void> {
        try {
            const { category = '', brand = '' } = req.query as ProductsFrontendQueryParams;

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

            const attributes: any = await ProductService.findAllAttributes({
                hostName: req.get('host'),
                query,
            });



            return controller.sendSuccessResponse(res, {
                requestedData: attributes,
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching attributes' });
        }
    }

    async findAllSpecifications(req: Request, res: Response): Promise<void> {
        try {
            const { category = '', brand = '' } = req.query as ProductsFrontendQueryParams;

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

            const specifications: any = await ProductService.findAllSpecifications({
                hostName: req.get('host'),
                query,
            });

            return controller.sendSuccessResponse(res, {
                requestedData: specifications,
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching specifications' });
        }
    }
    async findProductDetail(req: Request, res: Response): Promise<void> {
        try {
            const productId = req.params.id;
            if (productId) {

                const product = await ProductService.findOne(
                    productId,
                    { hostName: req.get('host') }
                );
                if (product) {

                    controller.sendSuccessResponse(res, {
                        requestedData: {
                            ...product

                        },
                        message: 'Success'
                    });
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Products are not found!',
                    });
                }
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Products Id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }

}
export default new ProductController();
import mongoose from 'mongoose';
import { Request, Response } from 'express';

import BaseController from '../../admin/base-controller';
import ProductService from '../../../services/frontend/guest/product-service'
import { ProductsFrontendQueryParams, ProductsQueryParams } from '../../../utils/types/products';
const controller = new BaseController();
import CommonService from '../../../services/frontend/guest/common-service';

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
                hostName: req.get('origin'),
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

    async findAllProducts(req: Request, res: Response): Promise<void> {
        try {
            const { category = '', brand = '', collectionproduct = '', collectionbrand = '', collectioncategory = '', getImageGallery = 0, getAttribute = 0, categories = '', brands = '', offer = '' } = req.query as ProductsFrontendQueryParams;
            let getSpecification = '1'
            let getSeo = '1'
            let getBrand = '1'
            let getCategory = '1'
            let query: any = { _id: { $exists: true } };
            let products: any

            query.status = '1';

            if (offer) {
                const offerData  =await CommonService.findOffers(offer)

                console.log("offerData", offerData);

            }

            console.log("qquery", query);


            if (categories) {
                const categoryArray = categories.split(',')
                const orConditions: any[] = [];

                for await (let category of categoryArray) {
                    const keywordRegex = new RegExp(category, 'i');

                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);

                    if (isObjectId) {
                        orConditions.push({ "productCategory.category._id": new mongoose.Types.ObjectId(category) });
                    } else {
                        orConditions.push({ "productCategory.category.slug": keywordRegex });
                    }

                    if (orConditions.length > 0) {
                        query = {
                            ...query,
                            $or: orConditions
                        };
                    }
                }
            }

            if (brands) {
                const brandArray = brands.split(',')
                const orConditions: any[] = [];

                for await (let brand of brandArray) {
                    const keywordRegex = new RegExp(brand, 'i');

                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(brand);

                    if (isObjectId) {
                        orConditions.push({ "brand._id": new mongoose.Types.ObjectId(brand) });
                    } else {
                        orConditions.push({ "brand.slug": keywordRegex });
                    }

                    if (orConditions.length > 0) {
                        query = {
                            ...query,
                            $or: orConditions
                        };
                    }
                }
            }

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
            if (collectionproduct) {
                products = {
                    ...products, collectionproduct: new mongoose.Types.ObjectId(collectionproduct)
                }
            }
            if (collectionbrand) {
                products = {
                    ...products, collectionbrand: new mongoose.Types.ObjectId(collectionbrand)
                }
            }
            if (collectioncategory) {
                products = {
                    ...products, collectioncategory: new mongoose.Types.ObjectId(collectioncategory)
                }
            }

            const productData: any = await ProductService.findProductList({
                query,
                products,
                getImageGallery,
                getAttribute,
                getSpecification,
                getSeo,
                getCategory,
                getBrand,
                hostName: req.get('host'),
            });

            return controller.sendSuccessResponse(res, {
                requestedData: productData,
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching specifications' });
        }
    }




}
export default new ProductController();
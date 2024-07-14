import mongoose from 'mongoose';
import { Request, Response } from 'express';

import BaseController from '../../../controllers/admin/base-controller';
import BrandService from '../../../services/frontend/guest/brand-service'
import CommonService from '../../../services/frontend/guest/common-service'
import { BrandQueryParams } from '../../../utils/types/brands';
import CategoryModel from '../../../model/admin/ecommerce/category-model';
import ProductCategoryLinkModel from '../../../model/admin/ecommerce/product/product-category-link-model';
import ProductsModel from '../../../model/admin/ecommerce/product-model';
const controller = new BaseController();

class BrandController extends BaseController {
    async findAllBrand(req: Request, res: Response): Promise<void> {
        try {
            const { category = '', brand = '', collectionproduct = '', collectionbrand = '', collectioncategory = '' } = req.query as BrandQueryParams;
            let query: any = {}

            query.status = '1';
            let collectionId: any
            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {

                if (!brand) {
                    if (category) {
                        const categoryIsObjectId = /^[0-9a-fA-F]{24}$/.test(category);
                        var findcategory
                        if (categoryIsObjectId) {
                            findcategory = { _id: category };
                        } else {
                            findcategory = await CategoryModel.findOne({ slug: category }, '_id');
                        }

                        if (findcategory && findcategory._id) {
                            let categoryIds: any[] = [findcategory._id];
                            async function fetchCategoryAndChildren(categoryId: any) {
                                let queue = [categoryId];
                                while (queue.length > 0) {
                                    const currentCategoryId = queue.shift();
                                    const categoriesData = await CategoryModel.find({ parentCategory: currentCategoryId }, '_id');
                                    const childCategoryIds = categoriesData.map(category => category._id);
                                    queue.push(...childCategoryIds);
                                    categoryIds.push(...childCategoryIds);
                                }
                            }
                            await fetchCategoryAndChildren(findcategory._id);
                            const categoryProductsIds = await ProductCategoryLinkModel.find({ categoryId: { $in: categoryIds } }).select('productId');
                            if (categoryProductsIds && categoryProductsIds.length > 0) {
                                const brandIds = await ProductsModel.find({ _id: { $in: categoryProductsIds.map((categoryProductsId: any) => categoryProductsId.productId) } }).select('brand');
                                query = {
                                    ...query, "_id": { $in: brandIds.map((brandId: any) => brandId.brand) }
                                }
                            }
                        }
                    }

                    if (collectionproduct) {
                        collectionId = {
                            ...collectionId, collectionproduct: new mongoose.Types.ObjectId(collectionproduct)
                        }
                    }
                    if (collectionbrand) {
                        collectionId = {
                            ...collectionId, collectionbrand: new mongoose.Types.ObjectId(collectionbrand)
                        }
                    }
                    if (collectioncategory) {
                        collectionId = {
                            ...collectionId, collectioncategory: new mongoose.Types.ObjectId(collectioncategory)
                        }
                    }
                }

                if (brand) {
                    const isObjectId = /^[0-9a-fA-F]{24}$/.test(brand);
                    if (isObjectId) {
                        query = {
                            ...query, _id: new mongoose.Types.ObjectId(brand)
                        }
                    } else {
                        query = {
                            ...query, slug: brand
                        }
                    }
                }

                const brands = await BrandService.findAll({
                    hostName: req.get('origin'),
                    query,
                }, collectionId);

                return controller.sendSuccessResponse(res, {
                    requestedData: brands,
                    message: 'Success!'
                }, 200);
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'Country is missing'
                }, req);
            }

        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching brands' });
        }
    }

}
export default new BrandController();
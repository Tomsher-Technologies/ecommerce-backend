import mongoose from 'mongoose';
import { Request, Response } from 'express';

import BaseController from '../../../controllers/admin/base-controller';
import BrandService from '../../../services/frontend/guest/brand-service'
import CommonService from '../../../services/frontend/guest/common-service'
import { BrandQueryParams } from '../../../utils/types/brands';
import CategoryModel from '../../../model/admin/ecommerce/category-model';
const controller = new BaseController();

class BrandController extends BaseController {
    async findAllBrand(req: Request, res: Response): Promise<void> {
        try {
            const { category = '', brand = '', collectionproduct = '', collectionbrand = '', collectioncategory = '', sortby = 'brandTitle', sortorder = 'asc' } = req.query as BrandQueryParams;
            let query: any = {}
            const orConditionsForcategory: any = [];

            query.status = '1';
            let products: any
            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));

            if (countryId) {
                const sort: any = {};
                if (sortby && sortorder) {
                    sort[sortby] = sortorder === 'desc' ? -1 : 1;
                }
                if (!brand) {
                    if (category) {
                        const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);

                        if (isObjectId) {
                            orConditionsForcategory.push({ "productCategory.category._id": new mongoose.Types.ObjectId(category) });
                            const findcategory = await CategoryModel.findOne({ _id: category }, '_id');

                            if (findcategory && findcategory._id) {
                                async function fetchCategoryAndChildren(categoryId: any) {
                                    const categoriesData = await CategoryModel.find({ parentCategory: categoryId }, '_id');
                                    const categoryIds = categoriesData.map(category => category._id);

                                    for (let childId of categoryIds) {
                                        orConditionsForcategory.push({ "productCategory.category._id": childId });

                                        await fetchCategoryAndChildren(childId);
                                    }
                                }

                                await fetchCategoryAndChildren(findcategory._id);
                                orConditionsForcategory.push({ "productCategory.category._id": findcategory._id });
                            } else {
                                query = {
                                    ...query, "productCategory.category._id": new mongoose.Types.ObjectId(category)
                                }
                            }

                        } else {
                            orConditionsForcategory.push({ "productCategory.category.slug": category });
                            const findcategory = await CategoryModel.findOne({ slug: category }, '_id');

                            if (findcategory && findcategory._id) {
                                async function fetchCategoryAndChildren(categoryId: any) {
                                    const categoriesData = await CategoryModel.find({ parentCategory: categoryId }, '_id');
                                    const categoryIds = categoriesData.map(category => category._id);

                                    for (let childId of categoryIds) {
                                        orConditionsForcategory.push({ "productCategory.category._id": childId });
                                        await fetchCategoryAndChildren(childId);
                                    }
                                }

                                await fetchCategoryAndChildren(findcategory._id);
                                orConditionsForcategory.push({ "productCategory.category._id": findcategory._id });
                            } else {
                                query = {
                                    ...query, "productCategory.category.slug": category
                                };

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

                if (orConditionsForcategory.length > 0) {
                    query.$and = [];
                    query.$and.push({
                        $or: orConditionsForcategory
                    });
                }

                const brands = await BrandService.findAll({
                    hostName: req.get('origin'),
                    query,
                    sort

                }, products);

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
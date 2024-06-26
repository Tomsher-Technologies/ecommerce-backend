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
            const { slug = '', category = '', brand = '',sortby = 'categoryTitle', sortorder = 'asc' } = req.query as CategoryQueryParams;
            const level = '0';
            let query: any = { _id: { $exists: true } };
            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));

            if (countryId) {
                const sort: any = {};
                if (sortby && sortorder) {
                    sort[sortby] = sortorder === 'desc' ? -1 : 1;
                }
                query.status = '1';

                // if (slug) {
                //     const keywordRegex = new RegExp(slug, 'i');
                //     query = {
                //         $or: [
                //             { slug: keywordRegex },
                //         ],
                //         ...query
                //     } as any;
                // }
                // if (brand) {

                //     const keywordRegex = new RegExp(brand, 'i');

                //     const isObjectId = /^[0-9a-fA-F]{24}$/.test(brand);

                //     if (isObjectId) {
                //         query = {
                //             ...query, "brand._id": new mongoose.Types.ObjectId(brand)
                //         }

                //     } else {
                //         query = {
                //             ...query, "brand.slug": keywordRegex
                //         }
                //     }
                // }
                /*  if (category) {
      
                      const keywordRegex = new RegExp(category, 'i');
      
                      const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
      
                      if (isObjectId) {
                          
                          query = {
                              ...query, "productCategory.category._id": new mongoose.Types.ObjectId(category)
                          }
      
                      } else {
                          console.log("keywordRegex,keywordRegex",keywordRegex);
      
                          query = {
      
                              ...query, "productCategory.category.slug": keywordRegex
                          }
                      }
                  }
                  else {
                      query = {
                          ...query, level: level
                      } as any;
                  }
      */
                if (category) {

                    const keywordRegex = new RegExp(category, 'i');

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
                // if (category) {
                //     const keywordRegex = new RegExp(category, 'i');
                //     var condition

                //     const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);

                //     if (isObjectId) {
                //         condition = { parentCategory: new mongoose.Types.ObjectId(category) }

                //     } else {
                //         condition = { slug: keywordRegex }
                //     }

                //     query = {
                //         $or: [
                //             condition
                //         ],
                //         ...query

                //     } as any;

                // } else {
                //     query = {
                //         ...query, level: level
                //     } as any;
                // }

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

}
export default new CategoryController();
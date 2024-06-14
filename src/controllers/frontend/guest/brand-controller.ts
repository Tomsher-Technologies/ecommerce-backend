import mongoose from 'mongoose';
import { Request, Response } from 'express';

import BaseController from '../../../controllers/admin/base-controller';
import BrandService from '../../../services/frontend/guest/brand-service'
import CommonService from '../../../services/frontend/guest/common-service'
import { BrandQueryParams } from '../../../utils/types/brands';
const controller = new BaseController();

class BrandController extends BaseController {
    async findAllBrand(req: Request, res: Response): Promise<void> {
        try {
            const { category = '', brand = '', collectionproduct = '', collectionbrand = '', collectioncategory = '' } = req.query as BrandQueryParams;
            let query: any = { _id: { $exists: true } };

            query.status = '1';
            let products: any
            const countryId = await CommonService.findOneCountrySubDomainWithId(req.get('origin'));

            if (countryId) {
                if (!brand) {

                    if (category) {

                        const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);

                        if (isObjectId) {
                            query = {
                                ...query, "productCategory.category._id": new mongoose.Types.ObjectId(category)
                            }

                        } else {
                            query = {
                                ...query, "productCategory.category.slug": category
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
                            ...query, "brand._id": new mongoose.Types.ObjectId(brand)
                        }

                    } else {
                        query = {
                            ...query, "brand.slug": brand
                        }
                    }
                }
                const brands = await BrandService.findAll({
                    hostName: req.get('origin'),
                    query

                }, products);
                console.log(query);

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
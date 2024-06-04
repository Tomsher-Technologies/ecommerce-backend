import 'module-alias/register';
import { Request, Response, response } from 'express';
const { ObjectId } = require('mongodb');

import { getCountryId } from '../../utils/helpers';
import { QueryParams } from '../../utils/types/common';

import BaseController from '../admin/base-controller';

import SliderService from '../../services/admin/ecommerce/slider-service';
import BannerService from '../../services/admin/ecommerce/banner-service';
import BrandsService from '../../services/admin/ecommerce/brands-service';
import ProductsService from '../../services/admin/ecommerce/product-service';
import CategoryService from '../../services/admin/ecommerce/category-service';

import GeneralService from '../../services/admin/general-service';
import CountryService from '../../services/admin/setup/country-service';
import { BrandProps } from '../../model/admin/ecommerce/brands-model';
import { BrandQueryParams } from '../../utils/types/brands';
import { ProductsProps, ProductsQueryParams } from '../../utils/types/products';
import collectionsProductsService from '../../services/admin/website/collections-products-service';
import { CategoryProps } from '../../model/admin/ecommerce/category-model';
import { CategoryQueryParams } from '../../utils/types/category';
import { CommonQueryParams } from '../../utils/types/frontend/common';
import { getCountryShortTitleFromHostname, getLanguageValueFromSubdomain } from '../../utils/frontend/sub-domain';
import CommonService from '../../services/frontend/common-service';

const controller = new BaseController();

class HomeController extends BaseController {

    async findAllSliders(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, page, pageReference } = req.query as CommonQueryParams;
            let query: any = { _id: { $exists: true } };

            const languageCode = getLanguageValueFromSubdomain(req.get('host'))
            const countryId = await CommonService.findOneCountryShortTitleWithId(req.get('host'))
            if (countryId) {
                if (page && pageReference) {
                    query = {
                        ...query, page: page, pageReference: pageReference
                    } as any;

                    query.countryId = countryId;
                    query.status = '1';

                    const sliders = await SliderService.findAll({
                        page: parseInt(page_size as string),
                        limit: 500,
                        query,
                    });
                    return controller.sendSuccessResponse(res, {
                        requestedData: sliders,
                        totalCount: await SliderService.getTotalCount(query),
                        message: 'Success!'
                    }, 200);
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Error',
                        validation: 'page and pageReference is missing! please check'
                    }, req);
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'page and pageReference is missing! please check'
                }, req);
            }

        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching sliders' });
        }
    }


    async findAllBanners(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, status = ['1', '2'], sortby = '', sortorder = '', keyword = '' } = req.query as QueryParams;
            let query: any = { _id: { $exists: true } };
            const userData = await res.locals.user;

            let countryId
            if (userData) {
                countryId = getCountryId(userData);
            }
            else {
                countryId = req.params.countryId
            }
            if (countryId) {
                query.countryId = countryId;
            }

            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            } else {
                query.status = '1';
            }

            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = {
                    $or: [
                        { bannerTitle: keywordRegex }
                    ],
                    ...query
                } as any;
            }
            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }

            const banners = await BannerService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            return controller.sendSuccessResponse(res, {
                requestedData: banners,
                totalCount: await BannerService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching banners' });
        }
    }

    async findAllBrands(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = '', status = ['1', '2'], sortby = '', sortorder = '', keyword = '' } = req.query as QueryParams;
            let query: any = { _id: { $exists: true } };

            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            } else {
                query.status = '1';
            }

            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = {
                    $or: [
                        { brandTitle: keywordRegex }
                    ],
                    ...query
                } as any;
            }

            const keysToCheck: (keyof BrandProps)[] = ['corporateGiftsPriority'];
            const filteredQuery = keysToCheck.reduce((result: any, key) => {
                if (key in req.query) {
                    result[key] = req.query[key];
                }
                return result;
            }, {} as Partial<BrandQueryParams>);
            let filteredPriorityQuery: any = {};
            if (Object.keys(filteredQuery).length > 0) {
                for (const key in filteredQuery) {
                    if (filteredQuery[key] === '> 0') {
                        filteredPriorityQuery[key] = { $gt: 0 }; // Set query for key greater than 0
                    } else if (filteredQuery[key] === '0') {
                        filteredPriorityQuery[key] = 0; // Set query for key equal to 0
                    } else if (filteredQuery[key] === '< 0' || filteredQuery[key] === null || filteredQuery[key] === undefined) {
                        filteredPriorityQuery[key] = { $lt: 0 }; // Set query for key less than 0
                    }
                }
            }

            query = { ...query, ...filteredPriorityQuery };

            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }

            const brands = await BrandsService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            return controller.sendSuccessResponse(res, {
                requestedData: brands,
                totalCount: await BrandsService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching brands' });
        }
    }

    async findAllCategory(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = '', status = ['1', '2'], sortby = '', sortorder = '', keyword = '' } = req.query as CategoryQueryParams;

            let query: any = { _id: { $exists: true } };

            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            } else {
                query.status = '1';
            }

            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = {
                    $or: [
                        { categoryTitle: keywordRegex },
                        { slug: keywordRegex },
                    ],
                    ...query
                } as any;
            }

            const keysToCheck: (keyof CategoryProps)[] = ['corporateGiftsPriority'];
            const filteredQuery = keysToCheck.reduce((result: any, key) => {
                if (key in req.query) {
                    result[key] = req.query[key];
                }
                return result;
            }, {} as Partial<CategoryQueryParams>);
            let filteredPriorityQuery: any = {};
            if (Object.keys(filteredQuery).length > 0) {
                for (const key in filteredQuery) {
                    if (filteredQuery[key] === '> 0') {
                        filteredPriorityQuery[key] = { $gt: 0 }; // Set query for key greater than 0
                    } else if (filteredQuery[key] === '0') {
                        filteredPriorityQuery[key] = 0; // Set query for key equal to 0
                    } else if (filteredQuery[key] === '< 0' || filteredQuery[key] === null || filteredQuery[key] === undefined) {
                        filteredPriorityQuery[key] = { $lt: 0 }; // Set query for key less than 0
                    }
                }
            }

            query = { ...query, ...filteredPriorityQuery };

            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }

            const categories = await CategoryService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            controller.sendSuccessResponse(res, {
                requestedData: categories,
                totalCount: await CategoryService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching categories' });
        }
    }

    async newArrivals(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, status = ['1', '2'], sortby = '', sortorder = '', keyword = '', productId, categoryId, unCollectionedProducts } = req.query as ProductsQueryParams;

            let query: any = { _id: { $exists: true } };

            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            } else {
                query.status = '1';
            }

            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = {
                    $or: [
                        { productTitle: keywordRegex },
                        { categoryTitle: keywordRegex },
                        { brandTitle: keywordRegex },
                    ],
                    ...query
                } as any;
            }

            if (productId) {
                query = {
                    ...query, _id: productId
                } as any;
            }

            if (categoryId) {
                query = {
                    ...query, category: categoryId
                } as any;
            }


            const keysToCheck: (keyof ProductsProps)[] = ['newArrivalPriority', 'corporateGiftsPriority'];
            const filteredQuery = keysToCheck.reduce((result: any, key) => {
                if (key in req.query) {
                    result[key] = req.query[key];
                }
                return result;
            }, {} as Partial<ProductsQueryParams>);
            let filteredPriorityQuery: any = {};
            if (Object.keys(filteredQuery).length > 0) {
                for (const key in filteredQuery) {
                    if (filteredQuery[key] === '> 0') {
                        filteredPriorityQuery[key] = { $gt: 0 }; // Set query for key greater than 0
                    } else if (filteredQuery[key] === '0') {
                        filteredPriorityQuery[key] = 0; // Set query for key equal to 0
                    } else if (filteredQuery[key] === '< 0' || filteredQuery[key] === null || filteredQuery[key] === undefined) {
                        filteredPriorityQuery[key] = { $lt: 0 }; // Set query for key less than 0
                    }
                }
            }
            if (unCollectionedProducts) {
                const collection = await collectionsProductsService.findOne(unCollectionedProducts);
                if (collection) {
                    // const unCollectionedProductIds = unCollectionedProducts ? unCollectionedProducts.split(',').map((id: string) => id.trim()) : [];
                    if (collection.collectionsProducts.length > 0) {
                        query._id = { $nin: collection.collectionsProducts };
                        query.status = '1';
                    }
                }
            }

            query = { ...query, ...filteredPriorityQuery };

            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }

            const products = await ProductsService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            controller.sendSuccessResponse(res, {
                requestedData: products,
                totalCount: await ProductsService.getTotalCount(query),
                message: 'Success'
            }, 200);
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching products' });
        }
    }



}

export default new HomeController();
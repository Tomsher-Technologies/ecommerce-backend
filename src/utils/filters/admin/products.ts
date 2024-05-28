import mongoose from "mongoose";
import { dateConvertPm } from "../../helpers";
import { ProductsProps, ProductsQueryParams } from "../../types/products";
import { Request, Response } from 'express';
import collectionsProductsService from "../../../services/admin/website/collections-products-service";
import ProductsService from '../../../services/admin/ecommerce/product-service'

export const filterProduct = async (req: Request) => {
    const { page_size = 1, limit = 10, status = ['1', '2'], sortby = '', sortorder = '', keyword = '', startDate, endDate, productId, attributeId, attributeDetailId, specificationId, specificationDetailId, brandId, categoryId, unCollectionedProducts } = req.query as ProductsQueryParams;
    let query: any = { _id: { $exists: true } };
    let queryFilterIds: any;
    let queryDate: any;

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
                { slug: keywordRegex },
                { 'productCategory.category.categoryTitle': keywordRegex },
                { 'brand.brandTitle': keywordRegex },
                { 'productCategory.category.slug': keywordRegex },
                { 'brand.slug': keywordRegex }
            ],
            ...query
        } as any;
    }


    if (startDate && endDate) {
        queryDate = {
            ...queryDate,
            createdAt: {
                $gte: new Date(startDate),
                $lte: dateConvertPm(endDate)
            }
        }
    }

    if (productId) {
        query = {
            ...query, _id: new mongoose.Types.ObjectId(productId)
        } as any;
    }

    if (categoryId) {
        queryFilterIds = {
            ...queryFilterIds,
            'productCategory.category._id': new mongoose.Types.ObjectId(categoryId)
        }
    }

    if (brandId) {
        queryFilterIds = {
            ...queryFilterIds,
            'brand._id': new mongoose.Types.ObjectId(brandId)
        }
    }

    if (attributeId) {
        queryFilterIds = {
            ...queryFilterIds,
            'productVariants.productVariantAttributes.attributeId': new mongoose.Types.ObjectId(attributeId)
        }
        if (attributeDetailId) {
            queryFilterIds = {
                ...queryFilterIds,
                'productVariants.productVariantAttributes.attributeDetail._id': new mongoose.Types.ObjectId(attributeDetailId)
            }
        }
    }
    if (specificationId) {
        queryFilterIds = {
            ...queryFilterIds,
            'productVariants.productVariantAttributes.specificationId': new mongoose.Types.ObjectId(specificationId)
        }
        if (specificationDetailId) {
            queryFilterIds = {
                ...queryFilterIds,
                'productVariants.productSpecification.specificationDetail._id': new mongoose.Types.ObjectId(specificationDetailId)
            }
        }
    }

    if (queryFilterIds && (Object.keys(queryFilterIds)).length > 0) {
        query = {
            ...query, ...queryFilterIds
        } as any;
    }

    if (queryDate && (Object.keys(queryDate)).length > 0) {
        query = {
            ...query, ...queryDate
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

    const count = await ProductsService.getTotalCount(query)
    return {
        products,
        count
    }
}
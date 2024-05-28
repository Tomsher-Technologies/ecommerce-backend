import mongoose from "mongoose";
import { dateConvertPm } from "../../helpers";
import { ProductsProps, ProductsQueryParams } from "../../types/products";
import { Request, Response } from 'express';
import collectionsProductsService from "../../../services/admin/website/collections-products-service";
import ProductsService from '../../../services/admin/ecommerce/product-service'

export const filterProduct = async (data: any) => {
    let query: any = { _id: { $exists: true } };
    let queryFilterIds: any;
    let queryDate: any;

    if (data.status && data.status !== '') {
        query.status = { $in: Array.isArray(data.status) ? data.status : [data.status] };
    } else {
        query.status = '1';
    }

    if (data.keyword) {
        const keywordRegex = new RegExp(data.keyword, 'i');
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

    if (data.fromDate || data.endDate) {
        if (data.fromDate) {
            queryDate = {
                ...queryDate,
                createdAt: {
                    $gte: new Date(data.fromDate)
                }
            }
        }
        if (data.endDate) {
            queryDate = {
                ...queryDate,
                createdAt: {
                    $lte: dateConvertPm(data.endDate)
                }
            }
        }

    }

    if (data.productId) {
        query = {
            ...query, _id: new mongoose.Types.ObjectId(data.productId)
        } as any;
    }

    if (data.categoryId) {
        queryFilterIds = {
            ...queryFilterIds,
            'productCategory.category._id': new mongoose.Types.ObjectId(data.categoryId)
        }
    }

    if (data.brandId) {
        queryFilterIds = {
            ...queryFilterIds,
            'brand._id': new mongoose.Types.ObjectId(data.brandId)
        }
    }

    if (data.attributeId) {
        queryFilterIds = {
            ...queryFilterIds,
            'productVariants.productVariantAttributes.attributeId': new mongoose.Types.ObjectId(data.attributeId)
        }
        if (data.attributeDetailId) {
            queryFilterIds = {
                ...queryFilterIds,
                'productVariants.productVariantAttributes.attributeDetail._id': new mongoose.Types.ObjectId(data.attributeDetailId)
            }
        }
    }
    if (data.specificationId) {
        queryFilterIds = {
            ...queryFilterIds,
            'productVariants.productSpecification.specificationId': new mongoose.Types.ObjectId(data.specificationId)
        }
        if (data.specificationDetailId) {
            queryFilterIds = {
                ...queryFilterIds,
                'productVariants.productSpecification.specificationDetail._id': new mongoose.Types.ObjectId(data.specificationDetailId)
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
        if (key in data) {
            result[key] = data[key];
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
    if (data.unCollectionedProducts) {
        const collection = await collectionsProductsService.findOne(data.unCollectionedProducts);
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
    if (data.sortby && data.sortorder) {
        sort[data.sortby] = data.sortorder === 'desc' ? -1 : 1;
    }
    return {
        query: query,
        sort: sort
    }
}
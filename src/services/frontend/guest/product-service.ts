import mongoose, { ObjectId } from 'mongoose';
import { frontendPagination, pagination } from '../../../components/pagination';
import AttributesModel from '../../../model/admin/ecommerce/attribute-model';

import ProductsModel from '../../../model/admin/ecommerce/product-model';
import SpecificationModel from '../../../model/admin/ecommerce/specifications-model';
import LanguagesModel from '../../../model/admin/setup/language-model';
import { attributeDetailLanguageFieldsReplace, attributeDetailsLookup, attributeLanguageFieldsReplace, attributeLookup, attributeProject } from '../../../utils/config/attribute-config';
import { brandLookup, brandObject, productCategoryLookup, imageLookup, productFinalProject, productMultilanguageFieldsLookup, productProject, productlanguageFieldsReplace, productVariantAttributesLookup, productSpecificationLookup, variantImageGalleryLookup, productSpecificationsLookup } from '../../../utils/config/product-config';
import { specificationDetailLanguageFieldsReplace, specificationLanguageLookup, specificationDetailsLookup, specificationLanguageFieldsReplace, specificationProject } from '../../../utils/config/specification-config';
import { getLanguageValueFromSubdomain } from '../../../utils/frontend/sub-domain';
import { collections } from '../../../constants/collections';
import { ProductsProps } from '../../../utils/types/products';
import { offerBrandPopulation, offerCategoryPopulation, offerProductPopulation } from '../../../utils/config/offer-config';

import CollectionsProductsModel from '../../../model/admin/website/collections-products-model';
import CollectionsBrandsModel from '../../../model/admin/website/collections-brands-model';
import CollectionsCategoriesModel from '../../../model/admin/website/collections-categories-model';
import CommonService from '../../../services/frontend/guest/common-service';
import ProductVariantAttributesModel from '../../../model/admin/ecommerce/product/product-variant-attribute-model';
import ProductSpecificationModel from '../../../model/admin/ecommerce/product/product-specification-model';
import SearchQueriesModel from '../../../model/frontend/search-query-model';
import CategoryModel from '../../../model/admin/ecommerce/category-model';
import ProductVariantsModel from '../../../model/admin/ecommerce/product/product-variants-model';
import OffersModel from '../../../model/admin/marketing/offers-model';


class ProductService {

    async findProductList(productOption: any): Promise<any> {
        var { query, sort, collectionProductsData, discount, getimagegallery, countryId, getbrand = '1', getLanguageValues = '1', getattribute, getspecification, hostName, offers, minprice, maxprice, isCount } = productOption;
        const { skip, limit } = frontendPagination(productOption.query || {}, productOption);

        let finalSort: any = [];
        if (!collectionProductsData) {
            // finalSort = [
            //     {
            //         $addFields: {
            //             sortOrder: {
            //                 $cond: { if: { $ifNull: ["$showOrder", false] }, then: 0, else: 1 }
            //             }
            //         }
            //     },
            //     {
            //         $sort: {
            //             sortOrder: 1,
            //             showOrder: 1,
            //             createdAt: -1
            //         }
            //     },
            //     {
            //         $project: {
            //             sortOrder: 0
            //         }
            //     },
            // ];

            const defaultSort = { createdAt: -1 };
            let finalSort = sort || defaultSort;
            const sortKeys = Object.keys(finalSort);
            if (sortKeys.length === 0) {
                finalSort = defaultSort;
            }
        }

        const variantLookupMatch: any = {
            $expr: {
                $eq: ['$countryId', new mongoose.Types.ObjectId(countryId)]
            },
            status: "1"
        };

        if (query['productVariants._id']) {
            variantLookupMatch._id = query['productVariants._id'];
        }

        if (query['productVariants.slug']) {
            variantLookupMatch.slug = query['productVariants.slug'];
        }

        const modifiedPipeline = {
            $lookup: {
                from: `${collections.ecommerce.products.productvariants.productvariants}`,
                localField: '_id',
                foreignField: 'productId',
                as: 'productVariants',
                pipeline: [
                    { $match: variantLookupMatch },
                    {
                        $project: {
                            _id: 1,
                            countryId: 1,
                            productId: 1,
                            slug: 1,
                            variantSku: 1,
                            showOrder: 1,
                            extraProductTitle: 1,
                            variantDescription: 1,
                            cartMaxQuantity: 1,
                            cartMinQuantity: 1,
                            discountPrice: 1,
                            price: 1,
                            quantity: 1,
                            isDefault: 1
                        }
                    },
                    ...((getattribute === '1' || query['productVariants.productVariantAttributes.attributeDetail._id'] || query['productVariants.productVariantAttributes.attributeDetail.itemName']) ? [...productVariantAttributesLookup] : []),
                    ...((getspecification === '1' || query['productVariants.productSpecification.specificationDetail._id'] || query['productVariants.productSpecification.specificationDetail.itemName']) ? [...productSpecificationLookup] : []),
                    ...(getimagegallery === '1' ? [variantImageGalleryLookup] : []),
                ]
            }
        };

        let pipeline: any[] = [
            ...finalSort,
            modifiedPipeline,
            productCategoryLookup,
            ...(getbrand === '1' ? [brandLookup, brandObject] : []),
            ...(getimagegallery === '1' ? [imageLookup] : []),
            ...(getspecification === '1' ? [productSpecificationsLookup] : []),
            {
                $match: {
                    $and: [
                        query,
                        { productVariants: { $ne: [] } }
                    ]
                }
            },
        ];
        const { pipeline: offerPipeline, getOfferList, offerApplied } = await CommonService.findOffers(offers, hostName, "", countryId)

        if (offerApplied.category.categories && offerApplied.category.categories.length > 0) {
            const offerCategory = offerCategoryPopulation(getOfferList, offerApplied.category)
            pipeline.push(offerCategory);
        }
        if (offerApplied.brand.brands && offerApplied.brand.brands.length > 0) {
            const offerBrand = offerBrandPopulation(getOfferList, offerApplied.brand)
            pipeline.push(offerBrand);
        }
        if (offerApplied.product.products && offerApplied.product.products.length > 0) {
            const offerProduct = offerProductPopulation(getOfferList, offerApplied.product)
            pipeline.push(offerProduct)
        }
        pipeline.push({
            $addFields: {
                offer: {
                    $cond: {
                        if: { $gt: [{ $size: { $ifNull: ["$categoryOffers", []] } }, 0] },
                        then: { $arrayElemAt: ["$categoryOffers", 0] },
                        else: {
                            $cond: {
                                if: { $gt: [{ $size: { $ifNull: ["$brandOffers", []] } }, 0] },
                                then: { $arrayElemAt: ["$brandOffers", 0] },
                                else: { $arrayElemAt: [{ $ifNull: ["$productOffers", []] }, 0] }
                            }
                        }
                    }
                }
            },
        });

        if (offerPipeline && offerPipeline.length > 0) {
            pipeline.push(offerPipeline[0])
        }

        let productData: any = [];
        let collectionPipeline: any = false;
        if (collectionProductsData) {
            collectionPipeline = await this.collection(collectionProductsData, hostName, pipeline)
        }
        if (collectionPipeline && collectionPipeline.categoryIds && collectionPipeline.categoryIds.length > 0) {
            let categoryIds: any[] = [];
            for (let i = 0; i < collectionPipeline.categoryIds.length; i++) {
                categoryIds.push(collectionPipeline.categoryIds[i]);
                async function fetchCategoryAndChildren(categoryId: any) {
                    let categoryArray = [categoryId];
                    while (categoryArray.length > 0) {
                        const currentCategoryId = categoryArray.shift();
                        const categoriesData = await CategoryModel.find({ parentCategory: currentCategoryId }, '_id');
                        const childCategoryIds = categoriesData.map(category => category._id);
                        categoryArray.push(...childCategoryIds);
                        categoryIds.push(...childCategoryIds);
                    }
                }
                await fetchCategoryAndChildren(collectionPipeline.categoryIds[i]);
            }
            const uniqueCategoryIds = [
                ...new Set(categoryIds.map(id => id.toString()))
            ].map(id => new mongoose.Types.ObjectId(id));

            const categoryOrderMapping = uniqueCategoryIds.map((id, index) => ({
                _id: id,
                order: index
            }));

            pipeline.push(
                {
                    $match: {
                        'productCategory.category._id': { $in: categoryOrderMapping.map(cat => cat._id) }
                    }
                },
                {
                    $unwind: '$productCategory'
                },
                {
                    $addFields: {
                        categoryOrder: {
                            $let: {
                                vars: {
                                    categoryId: '$productCategory.category._id'
                                },
                                in: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: categoryOrderMapping,
                                                as: 'item',
                                                cond: { $eq: ['$$item._id', '$$categoryId'] }
                                            }
                                        },
                                        0
                                    ]
                                }
                            }
                        }
                    }
                },

                {
                    $group: {
                        _id: '$_id',
                        productTitle: { $first: '$productTitle' },
                        slug: { $first: '$slug' },
                        showOrder: { $first: '$showOrder' },
                        starRating: { $first: '$starRating' },
                        productImageUrl: { $first: '$productImageUrl' },
                        description: { $first: '$description' },
                        brand: { $first: '$brand' },
                        unit: { $first: '$unit' },
                        warehouse: { $first: '$warehouse' },
                        measurements: { $first: '$measurements' },
                        tags: { $first: '$tags' },
                        sku: { $first: '$sku' },
                        status: { $first: '$status' },
                        createdAt: { $first: '$createdAt' },
                        offer: { $first: '$offer' },
                        productCategory: { $first: '$productCategory' },
                        productVariants: { $first: '$productVariants' },
                        languageValues: { $first: '$languageValues' },
                        productSpecification: { $first: '$productSpecification' },
                        imageGallery: { $first: '$imageGallery' },
                        categoryOrder: { $min: '$categoryOrder.order' }
                    }
                },
                {
                    $sort: {
                        categoryOrder: 1
                    }
                },


            );
        }
        if (collectionPipeline && collectionPipeline.brandIds && collectionPipeline.brandIds.length > 0) {
            pipeline.push({ $match: { 'brand._id': { $in: collectionPipeline.brandIds.map((id: any) => new mongoose.Types.ObjectId(id)) } } });
        }
        if (collectionProductsData && collectionProductsData.collectionproduct && collectionPipeline && collectionPipeline.productIds) {
            pipeline.push({ $match: { '_id': { $in: collectionPipeline.productIds.map((id: any) => new mongoose.Types.ObjectId(id)) } } });
        }
        if (getLanguageValues === '1') {
            const languageData = await LanguagesModel.find().exec();
            var lastPipelineModification: any
            const languageId = await getLanguageValueFromSubdomain(hostName, languageData);

            if (languageId != null) {
                lastPipelineModification = await this.productLanguage(hostName, pipeline)
                pipeline = lastPipelineModification
            }
        }

        pipeline.push(productProject);
        if ((sort && sort.price) || (minprice || maxprice) || discount) {
            pipeline.push({
                $addFields: {
                    selectedVariant: {
                        $arrayElemAt: [
                            {
                                $filter: {
                                    input: "$productVariants",
                                    as: "productVariant",
                                    cond: {
                                        $or: [
                                            {
                                                $and: [
                                                    { $gt: ["$$productVariant.quantity", 0] },
                                                    {
                                                        $or: [
                                                            { $eq: ["$$productVariant.isDefault", 1] },
                                                            { $eq: ["$$productVariant.isDefault", '1'] },
                                                            { $eq: ["$$productVariant.variantSku", "$sku"] },
                                                            { $eq: ["$$productVariant.slug", "$slug"] }
                                                        ]
                                                    }
                                                ]
                                            },
                                            {
                                                $or: [
                                                    { $eq: ["$$productVariant.isDefault", 1] },
                                                    { $eq: ["$$productVariant.isDefault", '1'] },
                                                    { $eq: ["$$productVariant.variantSku", "$sku"] },
                                                    { $eq: ["$$productVariant.slug", "$slug"] }
                                                ]
                                            }
                                        ]
                                    }
                                }
                            },
                            0
                        ]
                    }
                }
            });

            pipeline.push(
                {
                    $project: {
                        _id: 1,
                        productTitle: 1,
                        slug: 1,
                        showOrder: 1,
                        starRating: 1,
                        productImageUrl: 1,
                        description: 1,
                        brand: 1,
                        unit: 1,
                        warehouse: 1,
                        measurements: 1,
                        tags: 1,
                        sku: 1,
                        status: 1,
                        createdAt: 1,
                        offer: 1,
                        productCategory: 1,
                        productVariants: 1,
                        languageValues: 1,
                        productSpecification: 1,
                        imageGallery: 1,
                        selectedVariant: {
                            $arrayElemAt: ["$productVariants", 0]
                        },
                        categoryOrder: 1
                    }
                },
                {
                    $addFields: {
                        discountedPrice: {
                            $let: {
                                vars: {
                                    price: { $toDouble: { $ifNull: ["$selectedVariant.price", 0] } },
                                    discountPrice: { $toDouble: { $ifNull: ["$selectedVariant.discountPrice", 0] } },
                                    offerIN: { $toDouble: { $ifNull: ["$offer.offerIN", 0] } },
                                    offerType: "$offer.offerType"
                                },
                                in: {
                                    $cond: {
                                        if: { $gt: ["$$discountPrice", 0] },
                                        then: {
                                            $cond: {
                                                if: { $eq: ["$$offerType", "percent"] },
                                                then: {
                                                    $subtract: [
                                                        "$$discountPrice",
                                                        { $multiply: ["$$discountPrice", { $divide: ["$$offerIN", 100] }] }
                                                    ]
                                                },
                                                else: {
                                                    $subtract: ["$$discountPrice", "$$offerIN"]
                                                }
                                            }
                                        },
                                        else: {
                                            $cond: {
                                                if: { $eq: ["$$offerType", "percent"] },
                                                then: {
                                                    $subtract: [
                                                        "$$price",
                                                        { $multiply: ["$$price", { $divide: ["$$offerIN", 100] }] }
                                                    ]
                                                },
                                                else: {
                                                    $subtract: ["$$price", "$$offerIN"]
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
            );
            if (sort.price == 1) {
                pipeline.push(
                    { $sort: { discountedPrice: 1, _id: 1 } }
                );
            } else {
                pipeline.push(
                    { $sort: { discountedPrice: -1 } }
                );
            }
            if (discount) {
                pipeline.push({
                    $addFields: {
                        discountPercentage: {
                            $cond: {
                                if: { $gt: [{ $ifNull: [{ $arrayElemAt: ["$productVariants.price", 0] }, 0] }, 0] },
                                then: {
                                    $multiply: [
                                        { $divide: [{ $subtract: [{ $arrayElemAt: ["$productVariants.price", 0] }, "$discountedPrice"] }, { $arrayElemAt: ["$productVariants.price", 0] }] },
                                        100
                                    ]
                                },
                                else: 0
                            }
                        }
                    }
                });
            }
        }
        if (minprice || maxprice) {
            const priceFilter: any = {};
            if (minprice) {
                priceFilter.$gte = Number(minprice);
            }
            if (maxprice) {
                priceFilter.$lte = Number(maxprice);
            }

            pipeline.push({
                $match: {
                    discountedPrice: priceFilter
                }
            });
        }
        if (discount) {
            pipeline.push({
                $match: {
                    discountPercentage: { $gt: Number(discount) }
                }
            });
        }

        const dataPipeline: any[] = [{ $match: {} }];

        if (skip) {
            dataPipeline.push({ $skip: skip });
        }

        if (limit) {
            dataPipeline.push({ $limit: limit });
        }

        pipeline.push({
            $facet: {
                data: dataPipeline,
                ...(isCount === 1 ? { totalCount: [{ $count: "totalCount" }] } : {}),
            },
        },
            (isCount === 1 ? {
                $project: {
                    data: 1,
                    totalCount: { $arrayElemAt: ["$totalCount.totalCount", 0] }
                }
            } :
                {
                    $project: {
                        data: 1,
                    }
                })
        )

        productData = await ProductsModel.aggregate(pipeline).exec();
        const products = productData[0].data;
        if (isCount == 1) {
            const totalCount = productData[0].totalCount;
            return { products, totalCount }
        } else {
            return products
        }

    }

    async getProductDetailsFromFilter(productFindableValues: any, options: any) {
        var { query, collectionProductsData, discount, getimagegallery, getbrand = '1', getLanguageValues = '1', getattribute, getspecification, offers, minprice, maxprice, isCount } = options;
        let { countryId, skip, limit, sort, offer, hostName }: any = frontendPagination(options.query || {}, options);
        countryId = countryId || new mongoose.Types.ObjectId('663209ff5ded1a6bb444797a')
        let finalSort: any = [];
        if (!collectionProductsData) {
            // finalSort = [
            //     {
            //         $addFields: {
            //             sortOrder: {
            //                 $cond: { if: { $ifNull: ["$showOrder", false] }, then: 0, else: 1 }
            //             }
            //         }
            //     },
            //     {
            //         $sort: {
            //             sortOrder: 1,
            //             showOrder: 1,
            //             createdAt: -1
            //         }
            //     },
            //     {
            //         $project: {
            //             sortOrder: 0
            //         }
            //     },
            // ];

            const defaultSort = { createdAt: -1 };
            let finalSort = sort || defaultSort;
            const sortKeys = Object.keys(finalSort);
            if (sortKeys.length === 0) {
                finalSort = defaultSort;
            }
        }

        const variantLookupMatch: any = {
            $expr: {
                $eq: ['$countryId', new mongoose.Types.ObjectId(countryId)]
            },
            status: "1"
        };

        if (query && query['productVariants._id']) {
            variantLookupMatch._id = query['productVariants._id'];
        }

        if (query && query['productVariants.slug']) {
            variantLookupMatch.slug = query['productVariants.slug'];
        }

        const modifiedPipeline = {
            $lookup: {
                from: `${collections.ecommerce.products.productvariants.productvariants}`,
                localField: '_id',
                foreignField: 'productId',
                as: 'productVariants',
                pipeline: [
                    { $match: variantLookupMatch },
                    {
                        $project: {
                            _id: 1,
                            countryId: 1,
                            productId: 1,
                            slug: 1,
                            variantSku: 1,
                            showOrder: 1,
                            extraProductTitle: 1,
                            variantDescription: 1,
                            cartMaxQuantity: 1,
                            cartMinQuantity: 1,
                            discountPrice: 1,
                            price: 1,
                            quantity: 1,
                            isDefault: 1
                        }
                    },
                    ...((getattribute === '1' || (query && (query['productVariants.productVariantAttributes.attributeDetail._id'] || query['productVariants.productVariantAttributes.attributeDetail.itemName']))) ? [...productVariantAttributesLookup] : []),
                    ...((getspecification === '1' || (query && (query['productVariants.productSpecification.specificationDetail._id'] || query['productVariants.productSpecification.specificationDetail.itemName']))) ? [...productSpecificationLookup] : []),
                    ...(getimagegallery === '1' ? [variantImageGalleryLookup] : []),
                ]
            }
        };

        let pipeline: any[] = [
            ...finalSort,
            modifiedPipeline,
            productCategoryLookup,
            ...(getbrand === '1' ? [brandLookup, brandObject] : []),
            ...(getimagegallery === '1' ? [imageLookup] : []),
            ...(getspecification === '1' ? [productSpecificationsLookup] : []),
            {
                $match: {
                    $and: [
                        ...(query ? [{ query }] : []),
                        { productVariants: { $ne: [] } }
                    ]
                }
            },
        ];
        const { pipeline: offerPipeline, getOfferList, offerApplied } = await CommonService.findOffers(offers, hostName, "", countryId)
        if (getOfferList.length > 0) {
            if (offerApplied.category.categories && offerApplied.category.categories.length > 0) {
                const offerCategory = offerCategoryPopulation(getOfferList, offerApplied.category)
                pipeline.push(offerCategory);
            }
            if (offerApplied.brand.brands && offerApplied.brand.brands.length > 0) {
                const offerBrand = offerBrandPopulation(getOfferList, offerApplied.brand)
                pipeline.push(offerBrand);
            }
            if (offerApplied.product.products && offerApplied.product.products.length > 0) {
                const offerProduct = offerProductPopulation(getOfferList, offerApplied.product)
                pipeline.push(offerProduct)
            }
            pipeline.push({
                $addFields: {
                    offer: {
                        $cond: {
                            if: { $gt: [{ $size: { $ifNull: ["$categoryOffers", []] } }, 0] },
                            then: { $arrayElemAt: ["$categoryOffers", 0] },
                            else: {
                                $cond: {
                                    if: { $gt: [{ $size: { $ifNull: ["$brandOffers", []] } }, 0] },
                                    then: { $arrayElemAt: ["$brandOffers", 0] },
                                    else: { $arrayElemAt: [{ $ifNull: ["$productOffers", []] }, 0] }
                                }
                            }
                        }
                    }
                },
            });

            if (offerPipeline && offerPipeline.length > 0) {
                pipeline.push(offerPipeline[0])
            }
        }


        let productData: any = [];
        let collectionPipeline: any = false;
        if (collectionProductsData) {
            collectionPipeline = await this.collection(collectionProductsData, hostName, pipeline)
        }
        if (collectionPipeline && collectionPipeline.categoryIds && collectionPipeline.categoryIds.length > 0) {
            let categoryIds: any[] = [];
            for (let i = 0; i < collectionPipeline.categoryIds.length; i++) {
                categoryIds.push(collectionPipeline.categoryIds[i]);
                async function fetchCategoryAndChildren(categoryId: any) {
                    let categoryArray = [categoryId];
                    while (categoryArray.length > 0) {
                        const currentCategoryId = categoryArray.shift();
                        const categoriesData = await CategoryModel.find({ parentCategory: currentCategoryId }, '_id');
                        const childCategoryIds = categoriesData.map(category => category._id);
                        categoryArray.push(...childCategoryIds);
                        categoryIds.push(...childCategoryIds);
                    }
                }
                await fetchCategoryAndChildren(collectionPipeline.categoryIds[i]);
            }
            const uniqueCategoryIds = [
                ...new Set(categoryIds.map(id => id.toString()))
            ].map(id => new mongoose.Types.ObjectId(id));

            const categoryOrderMapping = uniqueCategoryIds.map((id, index) => ({
                _id: id,
                order: index
            }));

            pipeline.push(
                {
                    $match: {
                        'productCategory.category._id': { $in: categoryOrderMapping.map(cat => cat._id) }
                    }
                },
                {
                    $unwind: '$productCategory'
                },
                {
                    $addFields: {
                        categoryOrder: {
                            $let: {
                                vars: {
                                    categoryId: '$productCategory.category._id'
                                },
                                in: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: categoryOrderMapping,
                                                as: 'item',
                                                cond: { $eq: ['$$item._id', '$$categoryId'] }
                                            }
                                        },
                                        0
                                    ]
                                }
                            }
                        }
                    }
                },

                {
                    $group: {
                        _id: '$_id',
                        productTitle: { $first: '$productTitle' },
                        slug: { $first: '$slug' },
                        showOrder: { $first: '$showOrder' },
                        starRating: { $first: '$starRating' },
                        productImageUrl: { $first: '$productImageUrl' },
                        description: { $first: '$description' },
                        brand: { $first: '$brand' },
                        unit: { $first: '$unit' },
                        warehouse: { $first: '$warehouse' },
                        measurements: { $first: '$measurements' },
                        tags: { $first: '$tags' },
                        sku: { $first: '$sku' },
                        status: { $first: '$status' },
                        createdAt: { $first: '$createdAt' },
                        offer: { $first: '$offer' },
                        productCategory: { $first: '$productCategory' },
                        productVariants: { $first: '$productVariants' },
                        languageValues: { $first: '$languageValues' },
                        productSpecification: { $first: '$productSpecification' },
                        imageGallery: { $first: '$imageGallery' },
                        categoryOrder: { $min: '$categoryOrder.order' }
                    }
                },
                {
                    $sort: {
                        categoryOrder: 1
                    }
                },


            );
        }
        if (collectionPipeline && collectionPipeline.brandIds && collectionPipeline.brandIds.length > 0) {
            pipeline.push({ $match: { 'brand._id': { $in: collectionPipeline.brandIds.map((id: any) => new mongoose.Types.ObjectId(id)) } } });
        }
        if (collectionProductsData && collectionProductsData.collectionproduct && collectionPipeline && collectionPipeline.productIds) {
            pipeline.push({ $match: { '_id': { $in: collectionPipeline.productIds.map((id: any) => new mongoose.Types.ObjectId(id)) } } });
        }
        if (getLanguageValues === '1') {
            const languageData = await LanguagesModel.find().exec();
            var lastPipelineModification: any
            const languageId = await getLanguageValueFromSubdomain(hostName, languageData);

            if (languageId != null) {
                lastPipelineModification = await this.productLanguage(hostName, pipeline)
                pipeline = lastPipelineModification
            }
        }

        pipeline.push(productProject);
        if ((sort && sort.price) || (minprice || maxprice) || discount) {
            pipeline.push({
                $addFields: {
                    selectedVariant: {
                        $arrayElemAt: [
                            {
                                $filter: {
                                    input: "$productVariants",
                                    as: "productVariant",
                                    cond: {
                                        $or: [
                                            {
                                                $and: [
                                                    { $gt: ["$$productVariant.quantity", 0] },
                                                    {
                                                        $or: [
                                                            { $eq: ["$$productVariant.isDefault", 1] },
                                                            { $eq: ["$$productVariant.isDefault", '1'] },
                                                            { $eq: ["$$productVariant.variantSku", "$sku"] },
                                                            { $eq: ["$$productVariant.slug", "$slug"] }
                                                        ]
                                                    }
                                                ]
                                            },
                                            {
                                                $or: [
                                                    { $eq: ["$$productVariant.isDefault", 1] },
                                                    { $eq: ["$$productVariant.isDefault", '1'] },
                                                    { $eq: ["$$productVariant.variantSku", "$sku"] },
                                                    { $eq: ["$$productVariant.slug", "$slug"] }
                                                ]
                                            }
                                        ]
                                    }
                                }
                            },
                            0
                        ]
                    }
                }
            });

            pipeline.push(
                {
                    $project: {
                        _id: 1,
                        productTitle: 1,
                        slug: 1,
                        showOrder: 1,
                        starRating: 1,
                        productImageUrl: 1,
                        description: 1,
                        brand: 1,
                        unit: 1,
                        warehouse: 1,
                        measurements: 1,
                        tags: 1,
                        sku: 1,
                        status: 1,
                        createdAt: 1,
                        offer: 1,
                        productCategory: 1,
                        productVariants: 1,
                        languageValues: 1,
                        productSpecification: 1,
                        imageGallery: 1,
                        selectedVariant: {
                            $arrayElemAt: ["$productVariants", 0]
                        },
                        categoryOrder: 1
                    }
                },
                {
                    $addFields: {
                        discountedPrice: {
                            $let: {
                                vars: {
                                    price: { $toDouble: { $ifNull: ["$selectedVariant.price", 0] } },
                                    discountPrice: { $toDouble: { $ifNull: ["$selectedVariant.discountPrice", 0] } },
                                    offerIN: { $toDouble: { $ifNull: ["$offer.offerIN", 0] } },
                                    offerType: "$offer.offerType"
                                },
                                in: {
                                    $cond: {
                                        if: { $gt: ["$$discountPrice", 0] },
                                        then: {
                                            $cond: {
                                                if: { $eq: ["$$offerType", "percent"] },
                                                then: {
                                                    $subtract: [
                                                        "$$discountPrice",
                                                        { $multiply: ["$$discountPrice", { $divide: ["$$offerIN", 100] }] }
                                                    ]
                                                },
                                                else: {
                                                    $subtract: ["$$discountPrice", "$$offerIN"]
                                                }
                                            }
                                        },
                                        else: {
                                            $cond: {
                                                if: { $eq: ["$$offerType", "percent"] },
                                                then: {
                                                    $subtract: [
                                                        "$$price",
                                                        { $multiply: ["$$price", { $divide: ["$$offerIN", 100] }] }
                                                    ]
                                                },
                                                else: {
                                                    $subtract: ["$$price", "$$offerIN"]
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
            );
            if (sort.price == 1) {
                pipeline.push(
                    { $sort: { discountedPrice: 1, _id: 1 } }
                );
            } else {
                pipeline.push(
                    { $sort: { discountedPrice: -1 } }
                );
            }
            if (discount) {
                pipeline.push({
                    $addFields: {
                        discountPercentage: {
                            $cond: {
                                if: { $gt: [{ $ifNull: [{ $arrayElemAt: ["$productVariants.price", 0] }, 0] }, 0] },
                                then: {
                                    $multiply: [
                                        { $divide: [{ $subtract: [{ $arrayElemAt: ["$productVariants.price", 0] }, "$discountedPrice"] }, { $arrayElemAt: ["$productVariants.price", 0] }] },
                                        100
                                    ]
                                },
                                else: 0
                            }
                        }
                    }
                });
            }
        }
        if (minprice || maxprice) {
            const priceFilter: any = {};
            if (minprice) {
                priceFilter.$gte = Number(minprice);
            }
            if (maxprice) {
                priceFilter.$lte = Number(maxprice);
            }

            pipeline.push({
                $match: {
                    discountedPrice: priceFilter
                }
            });
        }
        if (discount) {
            pipeline.push({
                $match: {
                    discountPercentage: { $gt: Number(discount) }
                }
            });
        }

        const dataPipeline: any[] = [{ $match: {} }];

        if (skip) {
            dataPipeline.push({ $skip: skip });
        }

        if (limit) {
            dataPipeline.push({ $limit: limit });
        }

        pipeline.push({
            $facet: {
                data: dataPipeline,
                ...(isCount === 1 ? { totalCount: [{ $count: "totalCount" }] } : {}),
            },
        },
            (isCount === 1 ? {
                $project: {
                    data: 1,
                    totalCount: { $arrayElemAt: ["$totalCount.totalCount", 0] }
                }
            } :
                {
                    $project: {
                        data: 1,
                    }
                })
        )

        productData = await ProductsModel.aggregate(pipeline).exec();
        const products = productData[0].data;
        if (isCount == 1) {
            const totalCount = productData[0].totalCount;
            return { products, totalCount }
        } else {
            return products
        }
    }
    // async getProductDetailsFromFilter(productFindableValues: any, options: any) {
    //     let { countryId, skip, limit, sort, offer, hostName }: any = frontendPagination(options.query || {}, options);
    //     const currentDate = new Date();
    //     countryId = countryId || new mongoose.Types.ObjectId('663209ff5ded1a6bb444797a')
    //     // Step 1: Get relevant offers based on the current date, countryId, and status
    //     const offerQuery = {
    //         $and: [
    //             ...(offer ? [offer] : []),
    //             { "offerDateRange.0": { $lte: currentDate } },  // Offer start date <= current date
    //             { "offerDateRange.1": { $gte: currentDate } },  // Offer end date >= current date
    //             { "countryId": new mongoose.Types.ObjectId(countryId) },  // Match countryId
    //             { status: "2" }  // Only active offers
    //         ]
    //     };

    //     const getOfferList = await OffersModel.find(offerQuery)
    //         .select('_id countryId offerTitle offersBy offerApplyValues offerType offerIN buyQuantity getQuantity offerDateRange')
    //         .lean();

    //     // Step 2: Aggregate products and "join" with offers based on productId (converted to string)
    //     const productAggregation = [
    //         {
    //             $match: {
    //                 countryId: new mongoose.Types.ObjectId(countryId),  // Match the country
    //                 status: '1'  // Only active products
    //             }
    //         },
    //         {
    //             $addFields: {
    //                 productIdAsString: { $toString: '$_id' }  // Convert ObjectId to string for matching with offerApplyValues
    //             }
    //         },
    //         {
    //             $lookup: {
    //                 from: 'offers',  // Collection name of OffersModel
    //                 let: { productId: '$productIdAsString' },  // Pass productId as a string
    //                 pipeline: [
    //                     {
    //                         $addFields: {
    //                             offerApplyValuesAsString: {
    //                                 $map: {
    //                                     input: '$offerApplyValues',
    //                                     as: 'offerValue',
    //                                     in: { $toString: '$$offerValue' }  // Convert each offerApplyValue to string
    //                                 }
    //                             }
    //                         }
    //                     },
    //                     {
    //                         $match: {
    //                             $expr: {
    //                                 $and: [
    //                                     { $in: ['$$productId', '$offerApplyValuesAsString'] },  // Now matching string with string
    //                                     { $eq: ['$offersBy', 'products'] },  // Offers by products
    //                                     { $lte: [{ $arrayElemAt: ['$offerDateRange', 0] }, currentDate] },  // Offer start date <= current date
    //                                     { $gte: [{ $arrayElemAt: ['$offerDateRange', 1] }, currentDate] }  // Offer end date >= current date
    //                                 ]
    //                             }
    //                         }
    //                     },
    //                     {
    //                         $project: {
    //                             _id: 1,
    //                             offerTitle: 1,
    //                             offerType: 1,
    //                             offerIN: 1,
    //                             buyQuantity: 1,
    //                             getQuantity: 1
    //                         }
    //                     }
    //                 ],
    //                 as: 'offers'  // Store matched offers in 'offers' field
    //             }
    //         },
    //         {
    //             $sort: sort || { createdAt: -1 }  // Apply sorting if provided
    //         },
    //         {
    //             $skip: skip || 0  // Apply skip for pagination
    //         },
    //         {
    //             $limit: limit || 20  // Apply limit for pagination
    //         },
    //         {
    //             $project: {
    //                 _id: 1,
    //                 productId: 1,
    //                 countryId: 1,
    //                 variantSku: 1,
    //                 slug: 1,
    //                 extraProductTitle: 1,
    //                 variantDescription: 1,
    //                 price: 1,
    //                 discountPrice: 1,
    //                 quantity: 1,
    //                 cartMinQuantity: 1,
    //                 cartMaxQuantity: 1,
    //                 isDefault: 1,
    //                 status: 1,
    //                 showOrder: 1,
    //                 offers: 1  // Include offers data in the final result
    //             }
    //         }
    //     ];

    //     const productData = await ProductVariantsModel.aggregate(productAggregation).exec();

    //     return productData;
    // }

    async insertOrUpdateSearchQuery(
        keyword: string,
        countryId: mongoose.Types.ObjectId,
        customerId: mongoose.Types.ObjectId | null,
        guestUserId?: string
    ) {
        const query = {
            $or: [
                { customerId, searchQuery: keyword },
                { guestUserId, searchQuery: keyword }
            ]
        };

        const update = {
            $set: {
                countryId,
                searchQuery: keyword,
                lastSearchedAt: new Date(),
                ...(customerId ? { customerId } : {}),
                ...(guestUserId ? { guestUserId } : {})
            },
            $inc: { searchCount: 1 }
        };

        const searchQuery = await SearchQueriesModel.findOneAndUpdate(
            query,
            update,
            {
                upsert: true,
                new: true,
            }
        );
        return searchQuery;
    }

    async findAllAttributes(options: any): Promise<ProductsProps[]> {
        let { query, hostName } = pagination(options.query || {}, options);
        const { collectionId } = options;

        let pipeline: any[] = [];
        let collectionPipeline: any = false;
        if (collectionId) {
            collectionPipeline = await this.collection(collectionId, hostName, pipeline);
        }
        if (((query['productCategory.category._id']) || (collectionId && collectionId.collectioncategory))) {
            pipeline.push(productCategoryLookup)
        }
        if (collectionPipeline && collectionPipeline.categoryIds && collectionPipeline.categoryIds.length > 0) {
            pipeline.push({ $match: { 'productCategory.category._id': { $in: collectionPipeline.categoryIds.map((id: any) => new mongoose.Types.ObjectId(id)) } } });
        }
        if (collectionPipeline && collectionPipeline.brandIds && collectionPipeline.brandIds.length > 0) {
            pipeline.push({ $match: { 'brand': { $in: collectionPipeline.brandIds.map((id: any) => new mongoose.Types.ObjectId(id)) } } });
        }

        pipeline.push({ $match: query })
        let productIds: any[] = [];
        if (collectionId && collectionId.collectionproduct && collectionPipeline && collectionPipeline.productIds) {
            productIds = collectionPipeline.productIds;
        } else {
            const productData = await ProductsModel.aggregate(pipeline).exec();
            productIds = productData?.map((product: any) => product?._id);
        }

        var attributeDetail: any = [];
        if (productIds && productIds?.length > 0) {
            const productVariantAttributeDetailIdResult = await ProductVariantAttributesModel.aggregate([
                { $match: { productId: { $in: productIds } } },
                { $group: { _id: null, attributeDetailIds: { $push: "$attributeDetailId" } } },
                { $project: { _id: 0, attributeDetailIds: 1 } }
            ]);

            const productVariantAttributesDetailIds = productVariantAttributeDetailIdResult.length ? productVariantAttributeDetailIdResult[0].attributeDetailIds : [];
            if (productVariantAttributesDetailIds && productVariantAttributesDetailIds?.length > 0) {
                let attributePipeline: any[] = [
                    { $match: { attributeType: { $ne: "pattern" } } },
                    attributeDetailsLookup,
                    { $unwind: '$attributeValues' },
                    { $match: { 'attributeValues._id': { $in: productVariantAttributesDetailIds }, status: "1" } },
                    {
                        $group: {
                            _id: '$_id',
                            attributeTitle: { $first: '$attributeTitle' },
                            slug: { $first: '$slug' },
                            attributeType: { $first: '$attributeType' },
                            status: { $first: '$status' },
                            attributeValues: { $push: '$attributeValues' }
                        }
                    },
                    {
                        $project: {
                            attributeTitle: 1,
                            attributeValues: 1,
                            slug: 1,
                            attributeType: 1,
                            status: 1,
                            itemNameLowerCase: {
                                $map: {
                                    input: "$attributeValues",
                                    as: "spec",
                                    in: {
                                        $toLower: {
                                            $ifNull: ["$$spec.itemName", ""]
                                        }
                                    }
                                }
                            }
                        }
                    },
                    { $sort: { 'itemNameLowerCase': 1 } },
                    attributeProject,
                ];

                const languageData = await LanguagesModel.find().exec();
                const languageId = getLanguageValueFromSubdomain(hostName, languageData);
                if (languageId != null) {
                    attributePipeline = await this.attributeLanguage(hostName, attributePipeline)
                }

                attributePipeline.push(productFinalProject);
                attributeDetail = await AttributesModel.aggregate(attributePipeline).exec()
            }
        }
        return attributeDetail
    }

    async attributeLanguage(hostName: any, pipeline: any[]): Promise<any[]> {
        const languageData = await LanguagesModel.find().exec();
        const languageId = getLanguageValueFromSubdomain(hostName, languageData);
        if (languageId) {
            const attributeLookupWithLanguage = {
                ...attributeLookup,
                $lookup: {
                    ...attributeLookup.$lookup,
                    pipeline: attributeLookup.$lookup.pipeline.map((stage: any) => {
                        if (stage.$match && stage.$match.$expr) {
                            return {
                                ...stage,
                                $match: {
                                    ...stage.$match,
                                    $expr: {
                                        ...stage.$match.$expr,
                                        $and: [
                                            ...stage.$match.$expr.$and,
                                            { $eq: ['$languageId', languageId] },
                                        ]
                                    }
                                }
                            };
                        }
                        return stage;
                    })
                }
            };

            pipeline.push(attributeLookupWithLanguage);
            pipeline.push(attributeLanguageFieldsReplace);
            pipeline.push(attributeDetailLanguageFieldsReplace)
        }

        return pipeline
    }

    async findAllSpecifications(options: any): Promise<void | null> {
        const { query, hostName, collectionId } = options;
        var specificationDetail: any = []
        let pipeline: any[] = [];
        let collectionPipeline: any = false;
        if (collectionId) {
            collectionPipeline = await this.collection(collectionId, hostName, pipeline);
        }
        if (((query['productCategory.category._id']) || (collectionId && collectionId.collectioncategory))) {
            pipeline.push(productCategoryLookup)
        }
        if (collectionPipeline && collectionPipeline.categoryIds && collectionPipeline.categoryIds.length > 0) {
            pipeline.push({ $match: { 'productCategory.category._id': { $in: collectionPipeline.categoryIds.map((id: any) => new mongoose.Types.ObjectId(id)) } } });
        }
        if (collectionPipeline && collectionPipeline.brandIds && collectionPipeline.brandIds.length > 0) {
            pipeline.push({ $match: { 'brand': { $in: collectionPipeline.brandIds.map((id: any) => new mongoose.Types.ObjectId(id)) } } });
        }

        pipeline.push({ $match: query })

        let productIds: any[] = [];
        if (collectionId && collectionId.collectionproduct && collectionPipeline && collectionPipeline.productIds) {
            productIds = collectionPipeline.productIds;
        } else {
            const productData = await ProductsModel.aggregate(pipeline).exec();
            productIds = productData?.map((product: any) => product?._id);
        }

        var specificationDetail: any = [];
        if (productIds && productIds?.length > 0) {
            const productSpecificationDetailsResult = await ProductSpecificationModel.aggregate([
                { $match: { productId: { $in: productIds } } },
                { $group: { _id: null, specificationDetailIds: { $push: "$specificationDetailId" } } },
                { $project: { _id: 0, specificationDetailIds: 1 } }
            ]);

            const productSpecificationDetailIds = productSpecificationDetailsResult.length ? productSpecificationDetailsResult[0].specificationDetailIds : [];
            if (productSpecificationDetailIds && productSpecificationDetailIds?.length > 0) {
                let specificationPipeline: any[] = [
                    specificationDetailsLookup,
                    { $unwind: '$specificationValues' },
                    { $match: { 'specificationValues._id': { $in: productSpecificationDetailIds }, status: "1" } },
                    {
                        $group: {
                            _id: '$_id',
                            specificationTitle: { $first: '$specificationTitle' },
                            slug: { $first: '$slug' },
                            status: { $first: '$status' },
                            specificationValues: { $push: '$specificationValues' }
                        }
                    },
                    {
                        $project: {
                            specificationValues: 1,
                            specificationTitle: 1,
                            slug: 1,
                            status: 1,
                            itemNameLowerCase: {
                                $map: {
                                    input: "$specificationValues",
                                    as: "spec",
                                    in: {
                                        $toLower: {
                                            $ifNull: ["$$spec.itemName", ""]
                                        }
                                    }
                                }
                            }
                        }
                    },
                    { $sort: { 'itemNameLowerCase': 1 } },
                    specificationProject,
                    productFinalProject
                ];
                const languageData = await LanguagesModel.find().exec();
                const languageId = getLanguageValueFromSubdomain(hostName, languageData);
                if (languageId != null) {
                    specificationPipeline = await this.attributeLanguage(hostName, specificationPipeline)
                }

                specificationPipeline.push(productFinalProject);
                specificationDetail = await SpecificationModel.aggregate(specificationPipeline).exec()
            }
        }
        return specificationDetail
    }

    async specificationLanguage(hostName: any, pipeline: any): Promise<any[]> {
        const languageData = await LanguagesModel.find().exec();
        const languageId = getLanguageValueFromSubdomain(hostName, languageData);
        if (languageId) {
            const specificationLookupWithLanguage = {
                ...specificationLanguageLookup,
                $lookup: {
                    ...specificationLanguageLookup.$lookup,
                    pipeline: specificationLanguageLookup.$lookup.pipeline.map((stage: any) => {
                        if (stage.$match && stage.$match.$expr) {
                            return {
                                ...stage,
                                $match: {
                                    ...stage.$match,
                                    $expr: {
                                        ...stage.$match.$expr,
                                        $and: [
                                            ...stage.$match.$expr.$and,
                                            { $eq: ['$languageId', languageId] },
                                        ]
                                    }
                                }
                            };
                        }
                        return stage;
                    })
                }
            };

            pipeline.push(specificationLookupWithLanguage);
            pipeline.push(specificationLanguageFieldsReplace);
            pipeline.push(specificationDetailLanguageFieldsReplace)
        }

        return pipeline
    }

    async productLanguage(hostName: any, pipeline: any): Promise<void> {

        const languageData = await LanguagesModel.find().exec();

        const languageId = await getLanguageValueFromSubdomain(hostName, languageData);

        if (languageId) {
            const productLookupWithLanguage = {
                ...productMultilanguageFieldsLookup,
                $lookup: {
                    ...productMultilanguageFieldsLookup.$lookup,
                    pipeline: productMultilanguageFieldsLookup.$lookup.pipeline.map((stage: any) => {
                        if (stage.$match && stage.$match.$expr) {
                            return {
                                ...stage,
                                $match: {
                                    ...stage.$match,
                                    $expr: {
                                        ...stage.$match.$expr,
                                        $and: [
                                            ...stage.$match.$expr.$and,
                                            { $eq: ['$languageId', languageId] },
                                        ]
                                    }
                                }
                            };
                        }
                        return stage;
                    })
                }
            };

            pipeline.push(productLookupWithLanguage);
            pipeline.push(productlanguageFieldsReplace);
        }
        // pipeline.push(productProject);
        pipeline.push(productFinalProject);

        return pipeline
    }

    async collection(collectionId: any, hostName: any, pipeline?: any, countryIdVal?: ObjectId): Promise<void | any> {
        const countryId = countryIdVal || await CommonService.findOneCountrySubDomainWithId(hostName)
        var collections: any
        let returnData = {
            pipeline: null,
            categoryIds: false,
            brandIds: false,
            productIds: false,
        }
        if (collectionId && collectionId.collectioncategory) {
            collections = await CollectionsCategoriesModel.findOne({ _id: collectionId.collectioncategory, countryId })
            if (collections && collections.collectionsCategories) {
                if (collections.collectionsCategories.length > 0) {
                    const categoryIds = collections.collectionsCategories.map((categoryId: any) => new mongoose.Types.ObjectId(categoryId));
                    return returnData = {
                        ...returnData,
                        pipeline,
                        categoryIds
                    }
                }
            }

        } else if (collectionId && collectionId.collectionbrand) {
            collections = await CollectionsBrandsModel.findOne({ _id: collectionId.collectionbrand, countryId })
            if (collections && collections.collectionsBrands) {
                const brandIds = collections.collectionsBrands.map((brandId: any) => new mongoose.Types.ObjectId(brandId));
                return returnData = {
                    ...returnData,
                    brandIds
                }
            }
        } else if (collectionId && collectionId.collectionproduct) {
            collections = await CollectionsProductsModel.findOne({ _id: collectionId.collectionproduct, countryId })
            if (collections && collections.collectionsProducts) {
                if (collections.collectionsProducts.length > 0) {
                    const productIds = collections.collectionsProducts.map((productId: any) => new mongoose.Types.ObjectId(productId));
                    pipeline.push({
                        $match: {
                            _id: { $in: productIds },
                            status: "1"
                        }
                    });
                    return returnData = {
                        ...returnData,
                        pipeline,
                        productIds
                    }
                }
            }
        }

        return false
    }
}

export default new ProductService();

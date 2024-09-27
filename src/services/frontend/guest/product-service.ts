import mongoose, { ObjectId } from 'mongoose';
import { frontendPagination, pagination } from '../../../components/pagination';
import AttributesModel from '../../../model/admin/ecommerce/attribute-model';

import ProductsModel from '../../../model/admin/ecommerce/product-model';
import SpecificationModel from '../../../model/admin/ecommerce/specifications-model';
import LanguagesModel from '../../../model/admin/setup/language-model';
import { attributeDetailLanguageFieldsReplace, attributeDetailsLookup, attributeLanguageFieldsReplace, attributeLookup, attributeProject, frontendVariantAttributesLookup } from '../../../utils/config/attribute-config';
import { brandLookup, brandObject, productCategoryLookup, imageLookup, productFinalProject, productMultilanguageFieldsLookup, productProject, productlanguageFieldsReplace, productVariantAttributesLookup, productSpecificationLookup, variantImageGalleryLookup, productSpecificationsLookup, productLookup } from '../../../utils/config/product-config';
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
import ProductCategoryLinkModel from '../../../model/admin/ecommerce/product/product-category-link-model';
import ProductVariantsModel from '../../../model/admin/ecommerce/product/product-variants-model';
import BrandsModel from '../../../model/admin/ecommerce/brands-model';


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
    async getProductVariantDetailsV1(productFindableValues: any, options: any) {
        var { query, queryValues, sort, collectionProductsData, discount, getimagegallery, countryId, getbrand = '1', getLanguageValues = '1', getfilterattributes = '1', getattribute, getdiscount, getspecification, hostName, offers, minprice, maxprice, isCount } = options;
        const { skip, limit } = frontendPagination(options.query || {}, options);

        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }


        let collectionPipeline: any = false;
        let matchProductIds: any[] = productFindableValues?.matchProductIds?.length > 0 ? productFindableValues?.matchProductIds : [];
        if (collectionProductsData) {
            collectionPipeline = await this.collection(collectionProductsData, hostName)
        }
        if (collectionPipeline && collectionPipeline.categoryIds && collectionPipeline.categoryIds.length > 0) {
            async function fetchAllCategories(categoryIds: any[]): Promise<any[]> {
                let queue = [...categoryIds];
                const allCategoryIds = new Set([...categoryIds]);
                while (queue.length > 0) {
                    const categoriesData = await CategoryModel.find(
                        { parentCategory: { $in: queue } },
                        '_id'
                    );
                    const childCategoryIds = categoriesData.map(category => category._id);
                    if (childCategoryIds.length === 0) {
                        break;
                    }
                    queue = childCategoryIds;
                    childCategoryIds.forEach(id => allCategoryIds.add(id));
                }
                return Array.from(allCategoryIds);
            }
            const categoryIds = await fetchAllCategories([...new Set(collectionPipeline.categoryIds)]);
            const categoryProductIds = await ProductCategoryLinkModel.distinct('productId', { categoryId: { $in: categoryIds } });
            matchProductIds = [...new Set(categoryProductIds)]

        }
        if (collectionPipeline && collectionPipeline.brandIds && collectionPipeline.brandIds.length > 0) {
            matchProductIds = await ProductsModel.find({ brand: { $in: collectionPipeline.brandIds.map((id: any) => new mongoose.Types.ObjectId(id)) } })
        }
        if (collectionProductsData && collectionProductsData.collectionproduct && collectionPipeline && collectionPipeline.productIds) {
            matchProductIds = collectionPipeline.productIds.map((id: any) => new mongoose.Types.ObjectId(id))
        }

        const variantLookupMatch: any = {
            countryId: new mongoose.Types.ObjectId(countryId),
            ...(matchProductIds.length > 0 ? { productId: { $in: matchProductIds } } : {}),
            quantity: { $gt: 0 },
            status: "1"
        };
        if (query['_id']) {
            variantLookupMatch._id = query['_id'];
        }

        if (query['slug']) {
            variantLookupMatch.slug = query['slug'];
        }
        let pipeline: any[] = [
            {
                $match: {
                    $and: [
                        variantLookupMatch
                    ]
                }
            },
            { $sort: finalSort },
            {
                $lookup: {
                    from: "products",
                    let: { productId: "$productId" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", "$$productId"] },
                                status: '1'
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                productTitle: 1,
                                starRating: 1,
                                productImageUrl: 1,
                                description: 1,
                                longDescription: 1,
                                brand: 1,
                                tags: 1,
                                productCode: 1,
                                status: 1,
                            }
                        }
                    ],
                    as: "productDetails"
                }
            },
            {
                $match: {
                    productDetails: { $ne: [] }
                }
            },
            {
                $match: {
                    ...query 
                }
            },
            {
                $project: {
                    _id: 1,
                    itemCode: 1,
                    productId: 1,
                    countryId: 1,
                    variantSku: 1,
                    slug: 1,
                    showOrder: 1,
                    extraProductTitle: 1,
                    variantDescription: 1,
                    variantImageUrl: 1,
                    price: 1,
                    offerPrice: 1,
                    discountPrice: 1,
                    quantity: 1,
                    cartMinQuantity: 1,
                    cartMaxQuantity: 1,
                    isDefault: 1,
                    status: 1,
                    offerData: 1,
                    offerId: 1,
                    productDetails: { $arrayElemAt: ["$productDetails", 0] },
                }
            }
        ];
        pipeline.push(
            {
                $addFields: {
                    discountedPrice: {
                        $let: {
                            vars: {
                                price: { $toDouble: { $ifNull: ["$price", 0] } },
                                discountPrice: { $toDouble: { $ifNull: ["$discountPrice", 0] } },
                                offerPrice: { $toDouble: { $ifNull: ["$offerPrice", 0] } }
                            },
                            in: {
                                $cond: {
                                    if: { $gt: ["$$offerPrice", 0] },
                                    then: "$$offerPrice",
                                    else: {
                                        $cond: {
                                            if: { $gt: ["$$discountPrice", 0] },
                                            then: "$$discountPrice",
                                            else: "$$price"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
        );
        pipeline.push({
            $addFields: {
                discountPercentage: {
                    $cond: {
                        if: { $gt: ["$discountedPrice", 0] },
                        then: {
                            $multiply: [
                                { $divide: [{ $subtract: ["$price", "$discountedPrice"] }, "$price"] },
                                100
                            ]
                        },
                        else: 0
                    }
                },
            }
        });
        if ((sort && sort.price) || (minprice || maxprice) || discount) {
            if (sort.price == 1) {
                pipeline.push(
                    { $sort: { discountedPrice: 1, _id: 1 } }
                );
            } else {
                pipeline.push(
                    { $sort: { discountedPrice: -1 } }
                );
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
                const discountArray = discount.split(',').map(Number);
                const lowestDiscount = Math.min(...discountArray);
                if (lowestDiscount > 0) {
                    pipeline.push({
                        $match: {
                            discountPercentage: { $gt: lowestDiscount }
                        }
                    });
                }
            }
        }

        pipeline.push({
            $facet: {
                data: [
                    {
                        $match: {}
                    },
                    ...(skip ? [{ $skip: skip }] : []),
                    ...(limit ? [{ $limit: limit }] : []),
                ],
                productIds: [
                    {
                        $group: {
                            _id: null,
                            productIds: { $addToSet: "$productId" }
                        }
                    }
                ],
                ... ((getbrand === '1') ? {
                    brandIds: [
                        {
                            $group: {
                                _id: null,
                                brandIds: { $addToSet: "$productDetails.brand" }
                            }
                        }
                    ]
                } : {}),
                variantIds: [
                    {
                        $group: {
                            _id: null,
                            variantIds: { $addToSet: "$_id" }
                        }
                    },
                ],
                ...(getdiscount === '1' ? {
                    discountRanges: [
                        {
                            $group: {
                                _id: null,
                                maxDiscount: { $max: "$discountPercentage" }
                            }
                        },
                        {
                            $project: {
                                discountRanges: {
                                    $map: {
                                        input: { $range: [10, { $ceil: "$maxDiscount" }, 10] },
                                        as: "range",
                                        in: "$$range"
                                    }
                                }
                            }
                        }
                    ]
                } : {}),
                ...(isCount === 1 ? { totalCount: [{ $count: "totalCount" }] } : {}),
            },
        });

        pipeline.push({
            $project: {
                data: 1,
                productIds: {
                    $arrayElemAt: ["$productIds.productIds", 0]
                },
                variantIds: { $arrayElemAt: ["$variantIds.variantIds", 0] },
                ...(getbrand === '1' ? { brandIds: { $arrayElemAt: ["$brandIds.brandIds", 0] } } : {}),
                ...(getdiscount === '1' ? { discountRanges: { $arrayElemAt: ["$discountRanges.discountRanges", 0] } } : {}),
                ...(isCount === 1 ? { totalCount: { $arrayElemAt: ["$totalCount.totalCount", 0] } } : {})
            }
        });

        let productData = await ProductVariantsModel.aggregate(pipeline).exec();
        let products = productData[0].data;
        let productIds = productData[0].productIds;
        let variantIds = productData[0].variantIds;
        let brandIds = productData[0].brandIds;
        let discountRanges = productData[0].discountRanges;
        let paginatedVariantIds = products.flatMap((variant: any) => variant._id);
        let productVariantAttributes: any[] = [];
        let brands: any[] = [];
        let filterAttributes: any[] = [];
        if ((paginatedVariantIds.length > 0 && (getattribute === '1'))) {
            productVariantAttributes = await ProductVariantAttributesModel.aggregate(frontendVariantAttributesLookup({
                variantId: { $in: paginatedVariantIds }
            }));
        }
        if (brandIds && getbrand === '1') {
            brands = await BrandsModel.find({ _id: { $in: brandIds }, status: '1' }).select('_id brandTitle slug brandBannerImageUrl brandImageUrl description status')
        }

        if (getfilterattributes === '1') {
            filterAttributes = await ProductVariantAttributesModel.aggregate(frontendVariantAttributesLookup({
                variantId: { $in: variantIds }
            }));
        }

        if (isCount == 1) {
            const totalCount = productData[0].totalCount;
            return { productVariantAttributes, filterAttributes, discountRanges, products, totalCount, brands, productIds, variantIds, }
        } else {
            return { productVariantAttributes, filterAttributes, products, brands, productIds, variantIds, }
        }
    }
    async getProductDetailsV2(productFindableValues: any, options: any) {
        var { query, sort, collectionProductsData, discount, getimagegallery, countryId, getbrand = '1', getLanguageValues = '1', getattribute, getspecification, hostName, offers, minprice, maxprice, isCount } = options;
        const { skip, limit } = frontendPagination(options.query || {}, options);

        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        const variantLookupMatch: any = {
            $expr: {
                $eq: ['$countryId', new mongoose.Types.ObjectId(countryId)]
            },
            quantity: { $gt: 0 },
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
                            itemCode: 1,
                            productId: 1,
                            slug: 1,
                            variantSku: 1,
                            price: 1,
                            discountPrice: 1,
                            offerPrice: 1,
                            quantity: 1,
                            isDefault: 1,
                            showOrder: 1,
                            extraProductTitle: 1,
                            variantDescription: 1,
                            cartMaxQuantity: 1,
                            cartMinQuantity: 1,
                            offerData: 1,
                            offerId: 1,
                        }
                    },
                    // ...((getattribute === '1' || query['productVariants.productVariantAttributes.attributeDetail._id'] || query['productVariants.productVariantAttributes.attributeDetail.itemName']) ? [...productVariantAttributesLookup] : []),
                    // ...((getspecification === '1' || query['productVariants.productSpecification.specificationDetail._id'] || query['productVariants.productSpecification.specificationDetail.itemName']) ? [...productSpecificationLookup] : []),
                    // ...(getimagegallery === '1' ? [variantImageGalleryLookup] : []),
                ]
            }
        };

        let pipeline: any[] = [
            { $sort: finalSort },
            modifiedPipeline,
            // productCategoryLookup,
            // ...(getbrand === '1' ? [brandLookup, brandObject] : []),
            // ...(getimagegallery === '1' ? [imageLookup] : []),
            // ...(getspecification === '1' ? [productSpecificationsLookup] : []),
            {
                $match: {
                    $and: [
                        query,
                        { productVariants: { $ne: [] } }
                    ]
                }
            },
        ];


        let productData: any = [];
        let collectionPipeline: any = false;
        if (collectionProductsData) {
            collectionPipeline = await this.collection(collectionProductsData, hostName, pipeline)
        }
        if (collectionPipeline && collectionPipeline.categoryIds && collectionPipeline.categoryIds.length > 0) {
            async function fetchAllCategories(categoryIds: any[]): Promise<any[]> {
                let queue = [...categoryIds];
                const allCategoryIds = new Set([...categoryIds]);
                while (queue.length > 0) {
                    const categoriesData = await CategoryModel.find(
                        { parentCategory: { $in: queue } },
                        '_id'
                    );
                    const childCategoryIds = categoriesData.map(category => category._id);
                    if (childCategoryIds.length === 0) {
                        break;
                    }
                    queue = childCategoryIds;
                    childCategoryIds.forEach(id => allCategoryIds.add(id));
                }
                return Array.from(allCategoryIds);
            }
            const categoryIds = await fetchAllCategories([...new Set(collectionPipeline.categoryIds)]);
            const categoryProductIds = await ProductCategoryLinkModel.distinct('productId', { categoryId: { $in: categoryIds } });
            pipeline.push({ $match: { '_id': { $in: [...new Set(categoryProductIds)] } } });

        }
        if (collectionPipeline && collectionPipeline.brandIds && collectionPipeline.brandIds.length > 0) {
            pipeline.push({ $match: { 'brand': { $in: collectionPipeline.brandIds.map((id: any) => new mongoose.Types.ObjectId(id)) } } });
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
                            _id: { $arrayElemAt: ["$productVariants._id", 0] },
                            productId: { $arrayElemAt: ["$productVariants.productId", 0] },
                            countryId: { $arrayElemAt: ["$productVariants.countryId", 0] },
                            slug: { $arrayElemAt: ["$productVariants.slug", 0] },
                            variantSku: { $arrayElemAt: ["$productVariants.variantSku", 0] },
                            extraProductTitle: { $arrayElemAt: ["$productVariants.extraProductTitle", 0] },
                            variantDescription: { $arrayElemAt: ["$productVariants.variantDescription", 0] },
                            price: { $toDouble: { $ifNull: [{ $arrayElemAt: ["$productVariants.price", 0] }, 0] } },
                            discountPrice: { $toDouble: { $ifNull: [{ $arrayElemAt: ["$productVariants.discountPrice", 0] }, 0] } },
                            offerPrice: { $toDouble: { $ifNull: [{ $arrayElemAt: ["$productVariants.offerPrice", 0] }, 0] } },
                            quantity: { $toInt: { $ifNull: [{ $arrayElemAt: ["$productVariants.quantity", 0] }, 0] } },
                            cartMinQuantity: { $arrayElemAt: ["$productVariants.cartMinQuantity", 0] },
                            cartMaxQuantity: { $arrayElemAt: ["$productVariants.cartMaxQuantity", 0] },
                            isDefault: { $arrayElemAt: ["$productVariants.isDefault", 0] },
                            status: { $arrayElemAt: ["$productVariants.status", 0] },
                            offerData: { $arrayElemAt: ["$productVariants.offerData", 0] },
                            offerId: { $arrayElemAt: ["$productVariants.offerId", 0] },
                            showOrder: { $arrayElemAt: ["$productVariants.offerId", 0] },
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
                                    offerPrice: { $toDouble: { $ifNull: ["$selectedVariant.offerPrice", 0] } }
                                },
                                in: {
                                    $cond: {
                                        if: { $gt: ["$$offerPrice", 0] },
                                        then: "$$offerPrice",
                                        else: {
                                            $cond: {
                                                if: { $gt: ["$$discountPrice", 0] },
                                                then: "$$discountPrice",
                                                else: "$$price"
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

        pipeline.push(
            {
                $match: {
                    ...(productFindableValues?.categoryProductIds && productFindableValues.categoryProductIds.length > 0 ?
                        { _id: { $in: productFindableValues.categoryProductIds.map((id: any) => new mongoose.Types.ObjectId(id)) } }
                        : {}
                    )
                }
            },
            {
                $facet: {
                    data: dataPipeline,
                    // productIds: [
                    //     {
                    //         $group: {
                    //             _id: null,
                    //             productIds: { $addToSet: "$_id" } // Collect all unique productIds
                    //         }
                    //     }
                    // ],
                    // variantIds: [
                    //     {
                    //         $project: {
                    //             variantIds: {
                    //                 $map: {
                    //                     input: "$productVariants",
                    //                     as: "variant",
                    //                     in: "$$variant._id"
                    //                 }
                    //             }
                    //         }
                    //     },
                    //     {
                    //         $unwind: "$variantIds"
                    //     },
                    //     {
                    //         $group: {
                    //             _id: null,
                    //             variantIds: { $addToSet: "$variantIds" } // Collect all unique variantIds
                    //         }
                    //     }
                    // ],
                    paginatedVariantIds: [
                        {
                            $project: {
                                variantIds: {
                                    $reduce: {
                                        input: "$productVariants",
                                        initialValue: [],
                                        in: { $concatArrays: ["$$value", [{ $ifNull: ["$$this._id", null] }]] }
                                    }
                                }
                            }
                        },
                        {
                            $unwind: "$variantIds"
                        },
                        {
                            $sort: { "variantIds": 1 }
                        },
                        {
                            $skip: skip
                        },
                        {
                            $limit: limit
                        },
                        {
                            $group: {
                                _id: null,
                                paginatedVariantIds: { $addToSet: "$variantIds" }
                            }
                        }
                    ],
                    ... (getbrand === '1' ? {
                        brands: [
                            {
                                $lookup: {
                                    from: "brands",
                                    localField: "brand",
                                    foreignField: "_id",
                                    as: "brandData",
                                },
                            },
                            {
                                $unwind: {
                                    path: "$brandData",
                                    preserveNullAndEmptyArrays: true,
                                }
                            },
                            {
                                $group: {
                                    _id: "$brand",
                                    brandData: { $first: "$brandData" },
                                },
                            }
                        ]
                    } : {}),
                    ...(isCount === 1 && { totalCount: [{ $count: "totalCount" }] })
                }
            },
            {
                $project: {
                    data: 1,
                    ...(getbrand === '1' ? {
                        brands: 1
                    } : {}),
                    // productIds: { $arrayElemAt: ["$productIds.productIds", 0] },
                    // variantIds: {
                    //     $arrayElemAt: ["$variantIds.variantIds", 0]
                    // },
                    paginatedVariantIds: { $arrayElemAt: ["$paginatedVariantIds.paginatedVariantIds", 0] },  // Paginated variantIds
                    ...(isCount === 1 && { totalCount: { $arrayElemAt: ["$totalCount.totalCount", 0] } })
                }
            }
        );

        productData = await ProductsModel.aggregate(pipeline).exec();
        let products = productData[0].data;
        let brands = productData[0]?.brands;
        let productIds = productData[0]?.productIds;
        let variantIds = productData[0]?.variantIds;
        let paginatedVariantIds = products.flatMap((product: any) => product.productVariants.map((variant: any) => variant._id));
        let productVariantAttributes: any[] = [];
        if ((paginatedVariantIds.length > 0 && (getattribute === '1'))) {
            productVariantAttributes = await ProductVariantAttributesModel.aggregate(frontendVariantAttributesLookup({
                variantId: { $in: paginatedVariantIds }
            }));
        }
        if (isCount == 1) {
            const totalCount = productData[0].totalCount;
            return { productVariantAttributes, products, paginatedVariantIds, totalCount, brands }
        } else {
            return { productVariantAttributes, products, paginatedVariantIds, brands }
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
                        ... (pipeline ? { pipeline } : {}),
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
                    if (pipeline) {
                        pipeline.push({
                            $match: {
                                _id: { $in: productIds },
                                status: "1"
                            }
                        });
                    }
                    return returnData = {
                        ...returnData,
                        ... (pipeline ? { pipeline } : {}),
                        productIds
                    }
                }
            }
        }

        return false
    }
}

export default new ProductService();

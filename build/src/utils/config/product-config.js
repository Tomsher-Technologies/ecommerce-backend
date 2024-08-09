"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productDetailsWithVariant = exports.productProject = exports.productFinalProject = exports.productlanguageFieldsReplace = exports.productMultilanguageFieldsLookup = exports.imageLookup = exports.brandObject = exports.brandLookup = exports.productSpecificationsLookup = exports.specificationsLookup = exports.productSeoObject = exports.productCategoryLookup = exports.variantLookup = exports.productSpecificationAdminLookup = exports.productVariantAttributesAdminLookup = exports.variantImageGalleryLookup = exports.addFieldsProductSeo = exports.productSeoLookup = exports.addFieldsProductsSpecification = exports.addFieldsProductSpecification = exports.productSpecificationLookup = exports.addFieldsProductVariantAttributes = exports.productvariantattributesWithProductIdLookup = exports.productVariantAttributesLookup = exports.productLookup = void 0;
const collections_1 = require("../../constants/collections");
const multi_languages_1 = require("../../constants/multi-languages");
exports.productLookup = {
    $lookup: {
        from: `${collections_1.collections.ecommerce.products.products}`,
        localField: 'productId',
        foreignField: '_id',
        as: 'productDetails',
    }
};
exports.productVariantAttributesLookup = [
    {
        $lookup: {
            from: `${collections_1.collections.ecommerce.products.productvariants.productvariantattributes}`,
            localField: '_id',
            foreignField: 'variantId',
            as: 'productVariantAttributes',
            pipeline: [
                {
                    $lookup: {
                        from: `${collections_1.collections.ecommerce.attributedetails}`,
                        localField: 'attributeDetailId',
                        foreignField: '_id',
                        as: 'attributeDetail'
                    }
                },
                {
                    $unwind: "$attributeDetail"
                },
                {
                    $lookup: {
                        from: `${collections_1.collections.ecommerce.attributes}`,
                        localField: 'attributeId',
                        foreignField: '_id',
                        as: 'attribute'
                    }
                },
                {
                    $unwind: "$attribute"
                },
                {
                    $project: {
                        _id: 1, // Exclude _id from the output of the inner pipeline
                        variantId: 1,
                        attributeId: '$attribute._id',
                        attributeTitle: '$attribute.attributeTitle',
                        slug: '$attribute.slug',
                        attributeType: '$attribute.attributeType',
                        attributeDetail: 1
                    }
                }
            ]
        }
    }
];
exports.productvariantattributesWithProductIdLookup = {
    $lookup: {
        from: `${collections_1.collections.ecommerce.products.productvariants.productvariantattributes}`,
        localField: 'productId',
        foreignField: '_id',
        as: 'productDetails',
    }
};
exports.addFieldsProductVariantAttributes = {
    $addFields: {
        productVariantAttributes: {
            $map: {
                input: '$productVariantAttributes',
                in: {
                    variantId: '$$this.variantId',
                    _id: '$$this._id',
                    attributeId: '$$this.attribute._id',
                    attributeTitle: '$$this.attribute.attributeTitle',
                    slug: '$$this.attribute.slug',
                    attributeType: '$$this.attribute.attributeType',
                    attributeDetail: {
                        _id: '$$this.attributeDetail._id',
                        attributeId: '$$this.attributeDetail.attributeId',
                        itemName: '$$this.attributeDetail.itemName',
                        itemValue: '$$this.attributeDetail.itemValue'
                    }
                    // attributeDetail: {
                    //     _id: '$$this.attributeDetail._id',
                    //     attributeId: '$$this.attributeDetail.attributeId',
                    //     itemName: '$$this.attributeDetail.itemName',
                    //     itemValue: '$$this.attributeDetail.itemValue'
                    // }
                }
            }
        }
    }
};
exports.productSpecificationLookup = [
    {
        $lookup: {
            from: `${collections_1.collections.ecommerce.products.productvariants.productspecifications}`,
            localField: '_id',
            foreignField: 'variantId',
            as: 'productSpecification',
            pipeline: [
                {
                    $lookup: {
                        from: `${collections_1.collections.ecommerce.specifications}`,
                        localField: 'specificationId',
                        foreignField: '_id',
                        as: 'specification'
                    }
                },
                {
                    $unwind: "$specification"
                },
                {
                    $lookup: {
                        from: `${collections_1.collections.ecommerce.specificationdetails}`,
                        localField: 'specificationDetailId',
                        foreignField: '_id',
                        as: 'specificationDetail'
                    }
                },
                {
                    $unwind: "$specificationDetail"
                },
                // {
                //     $group: {
                //         _id: {
                //             productId: "$productId",
                //             specificationId: "$specificationId"
                //         },
                //         variantId: { $first: "$variantId" },
                //         specificationTitle: { $first: "$specification.specificationTitle" },
                //         specificationDisplayName: { $first: "$specification.specificationDisplayName" },
                //         enableTab: { $first: "$specification.enableTab" },
                //         slug: { $first: "$specification.slug" },
                //         specificationDetails: { $push: "$specificationDetail" }
                //     }
                // },
                {
                    $project: {
                        _id: 1,
                        variantId: 1,
                        specificationId: '$specification._id',
                        specificationTitle: '$specification.specificationTitle',
                        specificationDisplayName: '$specification.specificationDisplayName',
                        enableTab: '$specification.enableTab',
                        slug: '$specification.slug',
                        specificationDetail: '$specificationDetail'
                    }
                }
            ]
        }
    }
];
exports.addFieldsProductSpecification = {
    $addFields: {
        productSpecification: {
            $map: {
                input: '$productSpecification',
                in: {
                    variantId: '$$this.variantId',
                    _id: '$$this._id',
                    specificationId: '$$this.specification._id',
                    specificationTitle: '$$this.specification.specificationTitle',
                    enableTab: '$$this.specification.enableTab',
                    slug: '$$this.specification.slug',
                    specificationDetail: {
                        _id: '$$this.specificationDetail._id',
                        specificationId: '$$this.specificationDetail.specificationId',
                        itemName: '$$this.specificationDetail.itemName',
                        itemValue: '$$this.specificationDetail.itemValue'
                    }
                }
            }
        }
    }
};
exports.addFieldsProductsSpecification = {
    $addFields: {
        productSpecification: {
            $map: {
                input: '$productSpecification',
                in: {
                    productId: '$$this.productId',
                    _id: '$$this._id',
                    specificationId: '$$this.specification._id',
                    specificationTitle: '$$this.specification.specificationTitle',
                    enableTab: '$$this.specification.enableTab',
                    slug: '$$this.specification.slug',
                    specificationDetail: {
                        _id: '$$this.specificationDetail._id',
                        specificationId: '$$this.specificationDetail.specificationId',
                        itemName: '$$this.specificationDetail.itemName',
                        itemValue: '$$this.specificationDetail.itemValue'
                    }
                }
            }
        }
    }
};
exports.productSeoLookup = {
    $lookup: {
        from: `${collections_1.collections.ecommerce.seopages}`,
        localField: '_id',
        foreignField: 'pageReferenceId',
        as: 'productSeo'
    }
};
exports.addFieldsProductSeo = {
    $addFields: {
        productSeo: { $arrayElemAt: ['$productSeo', 0] }
    }
};
exports.variantImageGalleryLookup = {
    $lookup: {
        from: `${collections_1.collections.ecommerce.products.productgallaryimages}`,
        localField: '_id',
        foreignField: 'variantId',
        as: 'variantImageGallery'
    }
};
exports.productVariantAttributesAdminLookup = [
    {
        $lookup: {
            from: `${collections_1.collections.ecommerce.products.productvariants.productvariantattributes}`,
            localField: '_id',
            foreignField: 'variantId',
            as: 'productVariantAttributes',
            pipeline: [
                {
                    $lookup: {
                        from: `${collections_1.collections.ecommerce.attributedetails}`,
                        localField: 'attributeDetailId',
                        foreignField: '_id',
                        as: 'attributeDetail'
                    }
                },
                {
                    $unwind: "$attributeDetail"
                },
                {
                    $lookup: {
                        from: `${collections_1.collections.ecommerce.attributes}`,
                        localField: 'attributeId',
                        foreignField: '_id',
                        as: 'attribute'
                    }
                },
                {
                    $unwind: "$attribute"
                },
                {
                    $project: {
                        _id: 1,
                        variantId: 1,
                        productId: 1,
                        attribute: '$attribute',
                        attributeDetail: '$attributeDetail'
                    }
                }
            ]
        }
    }
];
exports.productSpecificationAdminLookup = [
    {
        $lookup: {
            from: `${collections_1.collections.ecommerce.products.productvariants.productspecifications}`,
            localField: '_id',
            foreignField: 'variantId',
            as: 'productSpecification',
            pipeline: [
                {
                    $lookup: {
                        from: `${collections_1.collections.ecommerce.specifications}`,
                        localField: 'specificationId',
                        foreignField: '_id',
                        as: 'specification'
                    }
                },
                {
                    $unwind: "$specification"
                },
                {
                    $lookup: {
                        from: `${collections_1.collections.ecommerce.specificationdetails}`,
                        localField: 'specificationDetailId',
                        foreignField: '_id',
                        as: 'specificationDetail'
                    }
                },
                {
                    $unwind: "$specificationDetail"
                },
                {
                    $project: {
                        _id: 1,
                        variantId: 1,
                        productId: 1,
                        specification: '$specification',
                        specificationDetail: '$specificationDetail'
                    }
                }
            ]
        }
    }
];
exports.variantLookup = {
    $lookup: {
        from: `${collections_1.collections.ecommerce.products.productvariants.productvariants}`,
        localField: '_id',
        foreignField: 'productId',
        as: 'productVariants',
        pipeline: [
            ...exports.productVariantAttributesAdminLookup,
            exports.addFieldsProductVariantAttributes,
            ...exports.productSpecificationAdminLookup,
            exports.addFieldsProductSpecification,
            exports.productSeoLookup,
            exports.addFieldsProductSeo,
            exports.variantImageGalleryLookup
        ]
    }
};
exports.productCategoryLookup = {
    $lookup: {
        from: `${collections_1.collections.ecommerce.products.productcategorylinks}`,
        localField: '_id',
        foreignField: 'productId',
        as: 'productCategory',
        pipeline: [{
                $lookup: {
                    from: `${collections_1.collections.ecommerce.categories}`,
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'category',
                },
            },
            {
                $unwind: "$category"
            },
            {
                $project: {
                    _id: 1,
                    productId: 1,
                    category: {
                        _id: 1,
                        categoryTitle: 1,
                        slug: 1,
                        parentCategory: 1,
                        level: 1,
                        categoryImageUrl: 1,
                        categorySecondImageUrl: 1,
                        status: 1,
                    }
                }
            }]
    }
};
exports.productSeoObject = {
    $addFields: {
        productSeo: { $arrayElemAt: ['$productSeo', 0] }
    }
};
exports.specificationsLookup = {
    $lookup: {
        from: `${collections_1.collections.ecommerce.products.productvariants.productspecifications}`,
        let: { productId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: { $eq: ['$productId', '$$productId'] },
                    'variantId': null
                }
            }
        ],
        as: 'productSpecification',
    },
};
exports.productSpecificationsLookup = {
    $lookup: {
        from: `${collections_1.collections.ecommerce.products.productvariants.productspecifications}`,
        let: { productId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: { $eq: ['$productId', '$$productId'] },
                    'variantId': null
                }
            },
            {
                $lookup: {
                    from: `${collections_1.collections.ecommerce.specifications}`,
                    localField: 'specificationId',
                    foreignField: '_id',
                    as: 'specification'
                }
            },
            {
                $unwind: "$specification"
            },
            {
                $lookup: {
                    from: `${collections_1.collections.ecommerce.specificationdetails}`, // Adjust collection name as per your setup
                    localField: 'specificationDetailId',
                    foreignField: '_id',
                    as: 'specificationDetail'
                }
            },
            {
                $unwind: "$specificationDetail" // Unwind to match each element
            },
            // {
            //     $group: {
            //         _id: {
            //             productId: "$productId",
            //             specificationId: "$specificationId"
            //         },
            //         variantId: { $first: "$variantId" },
            //         specificationTitle: { $first: "$specification.specificationTitle" },
            //         enableTab: { $first: "$specification.enableTab" },
            //         slug: { $first: "$specification.slug" },
            //         specificationDetails: { $push: "$specificationDetail" }
            //     }
            // },
            {
                $project: {
                    _id: 1,
                    variantId: 1,
                    specificationId: '$specification._id',
                    specificationTitle: '$specification.specificationTitle',
                    enableTab: '$specification.enableTab',
                    slug: '$specification.slug',
                    specificationDetail: '$specificationDetail'
                }
            }
        ],
        as: 'productSpecification',
    },
};
// export const specificationLookup = {
//     $lookup: {
//         from: 'multilanguagefieleds', // Ensure 'from' field is included
//         let: { specificationId: '$_id' },
//         pipeline: [
//             {
//                 $match: {
//                     $expr: {
//                         $and: [
//                             { $eq: ['$sourceId', '$$specificationId'] },
//                             { $eq: ['$source', multiLanguageSources.ecommerce.specifications] },
//                         ],
//                     },
//                 },
//             },
//         ],
//         as: 'languageValues',
//     }
// };
exports.brandLookup = {
    $lookup: {
        from: `${collections_1.collections.ecommerce.brands}`,
        localField: 'brand',
        foreignField: '_id',
        as: 'brand',
        pipeline: [
            {
                $project: {
                    _id: 1,
                    brandTitle: 1,
                    description: 1,
                    brandBannerImageUrl: 1,
                    slug: 1,
                    brandImageUrl: 1,
                    status: 1,
                }
            },
        ],
    },
    // $addFields: {
    //     brand: { $arrayElemAt: ['$brand', 0] }
    // }
};
exports.brandObject = {
    $addFields: {
        brand: { $arrayElemAt: ['$brand', 0] }
    }
};
exports.imageLookup = {
    $lookup: {
        from: collections_1.collections.ecommerce.products.productgallaryimages,
        localField: '_id',
        foreignField: 'productID',
        as: 'imageGallery',
    }
};
exports.productMultilanguageFieldsLookup = {
    $lookup: {
        from: 'multilanguagefieleds', // Ensure 'from' field is included
        let: { productId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$sourceId', '$$productId'] },
                            { $eq: ['$source', multi_languages_1.multiLanguageSources.ecommerce.products] },
                        ],
                    },
                },
            },
        ],
        as: 'languageValues',
    },
};
exports.productlanguageFieldsReplace = {
    $addFields: {
        productTitle: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ['$languageValues.languageValues.productTitle', 0] }, null] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.productTitle', 0] }, ''] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.productTitle', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.productTitle', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.productTitle', 0] }, "undefined"] },
                    ]
                },
                then: '$productTitle',
                else: { $arrayElemAt: ['$languageValues.languageValues.productTitle', 0] }
            }
        },
        productImageUrl: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ['$languageValues.languageValues.productImageUrl', 0] }, null] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.productImageUrl', 0] }, ''] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.productImageUrl', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.productImageUrl', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.productImageUrl', 0] }, "undefined"] },
                    ]
                },
                then: '$productImageUrl',
                else: { $arrayElemAt: ['$languageValues.languageValues.productImageUrl', 0] }
            }
        },
        description: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ['$languageValues.languageValues.description', 0] }, null] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.description', 0] }, ''] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.description', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.description', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.description', 0] }, "undefined"] },
                    ]
                },
                then: '$description',
                else: { $arrayElemAt: ['$languageValues.languageValues.description', 0] }
            }
        },
        longDescription: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ['$languageValues.languageValues.longDescription', 0] }, null] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.longDescription', 0] }, ''] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.longDescription', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.longDescription', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.longDescription', 0] }, "undefined"] },
                    ]
                },
                then: '$longDescription',
                else: { $arrayElemAt: ['$languageValues.languageValues.longDescription', 0] }
            }
        },
    }
};
exports.productFinalProject = {
    $project: {
        languageValues: 0
    }
};
exports.productProject = {
    $project: {
        _id: 1,
        productTitle: 1,
        slug: 1,
        productImageUrl: 1,
        description: 1,
        longDescription: 1,
        brand: 1,
        unit: 1,
        warehouse: 1,
        starRating: 1,
        measurements: 1,
        deliveryDays: 1,
        tags: 1,
        sku: 1,
        status: 1,
        createdAt: 1,
        offer: {
            $ifNull: ['$offer', {}]
        },
        productCategory: {
            $ifNull: ['$productCategory', []]
        },
        productVariants: {
            $ifNull: ['$productVariants', []]
        },
        languageValues: {
            $ifNull: ['$languageValues', []]
        },
        productSpecification: {
            $ifNull: ['$productSpecification', []]
        },
        imageGallery: {
            $ifNull: ['$imageGallery', []]
        }
    }
};
const productDetailsWithVariant = (query) => {
    const pipeline = [
        {
            $lookup: {
                from: `${collections_1.collections.ecommerce.products.productvariants.productvariants}`,
                localField: '_id',
                foreignField: 'productId',
                as: 'productvariants'
            }
        },
        { $unwind: '$productvariants' },
        {
            $project: {
                _id: 1,
                productTitle: 1,
                productvariants: {
                    _id: 1,
                    countryId: 1,
                    variantSku: 1,
                    extraProductTitle: 1,
                    slug: 1,
                    quantity: 1
                }
            }
        }
    ];
    if (query) {
        pipeline.push({ $match: query });
    }
    return pipeline;
};
exports.productDetailsWithVariant = productDetailsWithVariant;

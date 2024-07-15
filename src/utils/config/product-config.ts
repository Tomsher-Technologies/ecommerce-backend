import { collections } from "../../constants/collections";
import { multiLanguageSources } from "../../constants/multi-languages";
import ProductsModel from "../../model/admin/ecommerce/product-model";


export const productLookup = {
    $lookup: {
        from: `${collections.ecommerce.products.products}`,
        localField: 'productId',
        foreignField: '_id',
        as: 'productDetails',
    }
};
export const productVariantAttributesLookup = [
    {
        $lookup: {
            from: `${collections.ecommerce.products.productvariants.productvariantattributes}`,
            localField: '_id',
            foreignField: 'variantId',
            as: 'productVariantAttributes',
            pipeline: [
                {
                    $lookup: {
                        from: `${collections.ecommerce.attributedetails}`,
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
                        from: `${collections.ecommerce.attributes}`,
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

export const productvariantattributesWithProductIdLookup = {
    $lookup: {
        from: `${collections.ecommerce.products.productvariants.productvariantattributes}`,
        localField: 'productId',
        foreignField: '_id',
        as: 'productDetails',
    }
};

export const addFieldsProductVariantAttributes = {
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

export const productSpecificationLookup = [
    {
        $lookup: {
            from: `${collections.ecommerce.products.productvariants.productspecifications}`,
            localField: '_id',
            foreignField: 'variantId',
            as: 'productSpecification',
            pipeline: [
                {
                    $lookup: {
                        from: `${collections.ecommerce.specifications}`,
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
                        from: `${collections.ecommerce.specificationdetails}`,
                        localField: 'specificationDetailId',
                        foreignField: '_id',
                        as: 'specificationDetail'
                    }
                },
                {
                    $unwind: "$specificationDetail"
                },
                {
                    $group: {
                        _id: {
                            productId: "$productId",
                            specificationId: "$specificationId"
                        },
                        variantId: { $first: "$variantId" },
                        specificationTitle: { $first: "$specification.specificationTitle" },
                        enableTab: { $first: "$specification.enableTab" },
                        slug: { $first: "$specification.slug" },
                        specificationDetails: { $push: "$specificationDetail" }
                    }
                },
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
            ]
        }
    }
];

export const addFieldsProductSpecification = {
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
export const addFieldsProductsSpecification = {
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

export const productSeoLookup = {
    $lookup: {
        from: `${collections.ecommerce.seopages}`,
        localField: '_id',
        foreignField: 'pageReferenceId',
        as: 'productSeo'
    }
};

export const addFieldsProductSeo = {
    $addFields: {
        productSeo: { $arrayElemAt: ['$productSeo', 0] }
    }
};

export const variantImageGalleryLookup = {
    $lookup: {
        from: `${collections.ecommerce.products.productgallaryimages}`,
        localField: '_id',
        foreignField: 'variantId',
        as: 'variantImageGallery'
    }
};


export const productVariantAttributesAdminLookup = [
    {
        $lookup: {
            from: `${collections.ecommerce.products.productvariants.productvariantattributes}`,
            localField: '_id',
            foreignField: 'variantId',
            as: 'productVariantAttributes',
            pipeline: [
                {
                    $lookup: {
                        from: `${collections.ecommerce.attributedetails}`,
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
                        from: `${collections.ecommerce.attributes}`,
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

export const productSpecificationAdminLookup = [
    {
        $lookup: {
            from: `${collections.ecommerce.products.productvariants.productspecifications}`,
            localField: '_id',
            foreignField: 'variantId',
            as: 'productSpecification',
            pipeline: [
                {
                    $lookup: {
                        from: `${collections.ecommerce.specifications}`,
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
                        from: `${collections.ecommerce.specificationdetails}`,
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

export const variantLookup = {
    $lookup: {
        from: `${collections.ecommerce.products.productvariants.productvariants}`,
        localField: '_id',
        foreignField: 'productId',
        as: 'productVariants',
        pipeline: [
            ...productVariantAttributesAdminLookup,
            addFieldsProductVariantAttributes,
            ...productSpecificationAdminLookup,
            addFieldsProductSpecification,
            productSeoLookup,
            addFieldsProductSeo,
            variantImageGalleryLookup
        ]
    }
};




export const productCategoryLookup = {
    $lookup: {
        from: `${collections.ecommerce.products.productcategorylinks}`,
        localField: '_id',
        foreignField: 'productId',
        as: 'productCategory',
        pipeline: [{
            $lookup: {
                from: `${collections.ecommerce.categories}`,
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
                    status: 1,
                }
            }
        }]

    }
};


export const productSeoObject = {
    $addFields: {
        productSeo: { $arrayElemAt: ['$productSeo', 0] }
    }
};


export const specificationsLookup = {
    $lookup: {
        from: `${collections.ecommerce.products.productvariants.productspecifications}`,
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

export const productSpecificationsLookup = {
    $lookup: {
        from: `${collections.ecommerce.products.productvariants.productspecifications}`,
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
                    from: `${collections.ecommerce.specifications}`,
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
                    from: `${collections.ecommerce.specificationdetails}`, // Adjust collection name as per your setup
                    localField: 'specificationDetailId',
                    foreignField: '_id',
                    as: 'specificationDetail'
                }
            },
            {
                $unwind: "$specificationDetail" // Unwind to match each element
            },
            {
                $group: {
                    _id: {
                        productId: "$productId",
                        specificationId: "$specificationId"
                    },
                    variantId: { $first: "$variantId" },
                    specificationTitle: { $first: "$specification.specificationTitle" },
                    enableTab: { $first: "$specification.enableTab" },
                    slug: { $first: "$specification.slug" },
                    specificationDetails: { $push: "$specificationDetail" }
                }
            },
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

export const brandLookup = {
    $lookup: {
        from: `${collections.ecommerce.brands}`,
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
export const brandObject = {
    $addFields: {
        brand: { $arrayElemAt: ['$brand', 0] }
    }
};

export const imageLookup = {
    $lookup: {
        from: collections.ecommerce.products.productgallaryimages,
        localField: '_id',
        foreignField: 'productID',
        as: 'imageGallery',
    }
};



export const productMultilanguageFieldsLookup = {
    $lookup: {
        from: 'multilanguagefieleds', // Ensure 'from' field is included
        let: { productId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$sourceId', '$$productId'] },
                            { $eq: ['$source', multiLanguageSources.ecommerce.products] },
                        ],
                    },
                },
            },
        ],
        as: 'languageValues',
    },
};

export const productlanguageFieldsReplace = {
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
}

export const productFinalProject = {
    $project: {
        languageValues: 0
    }
};

export const productProject = {
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
}


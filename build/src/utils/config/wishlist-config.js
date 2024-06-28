"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wishlistFinalProject = exports.multilanguageFieldsLookup = exports.replaceProductLookupValues = exports.wishlistOfferCategory = exports.wishlistOfferBrandPopulation = exports.wishlistOfferProductPopulation = exports.wishlistProductCategoryLookup = exports.productVariantsLookupValues = void 0;
const collections_1 = require("../../constants/collections");
const product_config_1 = require("./product-config");
const productVariantsLookupValues = (getattribute) => {
    return ({
        $lookup: {
            from: `${collections_1.collections.ecommerce.products.productvariants.productvariants}`,
            let: { productId: "$productDetails._id", variantId: "$variantId" },
            pipeline: [
                ...(getattribute === '1' ? [...product_config_1.productVariantAttributesLookup] : []),
                ...(getattribute === '1' ? [product_config_1.addFieldsProductVariantAttributes] : []),
                { $match: { $expr: { $eq: ["$_id", "$$variantId"] } } }
            ],
            as: "productDetails.variantDetails"
        }
    });
};
exports.productVariantsLookupValues = productVariantsLookupValues;
exports.wishlistProductCategoryLookup = {
    $lookup: {
        from: `${collections_1.collections.ecommerce.products.productcategorylinks}`,
        localField: 'productDetails._id',
        foreignField: 'productId',
        as: 'productDetails.productCategory',
        pipeline: [
            {
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
                        status: 1,
                    }
                }
            }
        ]
    }
};
const wishlistOfferProductPopulation = (getOfferList, offerApplied) => {
    return {
        $addFields: {
            "productDetails.productOffers": {
                $arrayElemAt: [
                    {
                        $filter: {
                            input: getOfferList,
                            as: "offer",
                            cond: {
                                $and: [
                                    { $in: ["$$offer._id", offerApplied.offerId] }, // Match offer ID
                                    { $in: ["$productId", offerApplied.products] } // Match product ID
                                ]
                            }
                        }
                    },
                    0
                ]
            }
        }
    };
};
exports.wishlistOfferProductPopulation = wishlistOfferProductPopulation;
const wishlistOfferBrandPopulation = (getOfferList, offerApplied) => {
    return {
        $addFields: {
            "productDetails.brandOffers": {
                $arrayElemAt: [
                    {
                        $filter: {
                            input: getOfferList,
                            as: "offer",
                            cond: {
                                $and: [
                                    { $in: ["$$offer._id", offerApplied.offerId] }, // Match offer ID
                                    { $in: ["$brand._id", offerApplied.brands] } // Match brand ID
                                ]
                            }
                        }
                    },
                    0
                ]
            }
        }
    };
};
exports.wishlistOfferBrandPopulation = wishlistOfferBrandPopulation;
const wishlistOfferCategory = (getOfferList, offerApplied) => {
    return {
        $addFields: {
            "productDetails.categoryOffers": {
                $arrayElemAt: [
                    {
                        $filter: {
                            input: getOfferList,
                            as: "offer",
                            cond: {
                                $and: [
                                    { $in: ["$$offer._id", offerApplied.offerId] }, // Match offer ID
                                    {
                                        $gt: [
                                            {
                                                $size: {
                                                    $filter: {
                                                        input: "$productDetails.productCategory.category",
                                                        as: "cat",
                                                        cond: {
                                                            $in: ["$$cat._id", offerApplied.categories]
                                                        }
                                                    }
                                                }
                                            },
                                            0
                                        ]
                                    } // Match category ID within productCategory array
                                ]
                            }
                        }
                    },
                    0
                ]
            }
        }
    };
};
exports.wishlistOfferCategory = wishlistOfferCategory;
exports.replaceProductLookupValues = {
    $set: {
        "productDetails.productTitle": {
            $cond: {
                if: {
                    $or: [
                        { $eq: ["$productDetails.languageValues.languageValues.productTitle", null] },
                        { $eq: ["$productDetails.languageValues.languageValues.productTitle", ""] },
                        { $eq: ["$productDetails.languageValues.languageValues.productTitle", "undefined"] },
                        { $eq: [{ $type: "$productDetails.languageValues.languageValues.productTitle" }, "missing"] }
                    ]
                },
                then: "$productDetails.productTitle",
                else: "$productDetails.languageValues.languageValues.productTitle"
            }
        },
        "productDetails.description": {
            $cond: {
                if: {
                    $or: [
                        { $eq: ["$productDetails.languageValues.languageValues.description", null] },
                        { $eq: ["$productDetails.languageValues.languageValues.description", ""] },
                        { $eq: ["$productDetails.languageValues.languageValues.description", "undefined"] },
                        { $eq: [{ $type: "$productDetails.languageValues.languageValues.description" }, "missing"] }
                    ]
                },
                then: "$productDetails.description",
                else: "$productDetails.languageValues.languageValues.description"
            }
        },
        "productDetails.longDescription": {
            $cond: {
                if: {
                    $or: [
                        { $eq: ["$productDetails.languageValues.languageValues.longDescription", null] },
                        { $eq: ["$productDetails.languageValues.languageValues.longDescription", ""] },
                        { $eq: ["$productDetails.languageValues.languageValues.longDescription", "undefined"] },
                        { $eq: [{ $type: "$productDetails.languageValues.languageValues.longDescription" }, "missing"] }
                    ]
                },
                then: "$productDetails.longDescription",
                else: "$productDetails.languageValues.languageValues.longDescription"
            }
        },
    }
};
const multilanguageFieldsLookup = (languageId) => ({
    $lookup: {
        from: `${collections_1.collections.multilanguagefieleds}`,
        let: { productId: "$productDetails._id", languageIdVar: languageId },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$sourceId', '$$productId'] },
                            { $eq: ['$source', 'products'] },
                            { $eq: ['$languageId', '$$languageIdVar'] }
                        ],
                    },
                },
            },
        ],
        as: 'productDetails.languageValues'
    }
});
exports.multilanguageFieldsLookup = multilanguageFieldsLookup;
exports.wishlistFinalProject = {
    $project: {
        languageValues: 0
    }
};

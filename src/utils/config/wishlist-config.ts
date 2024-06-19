import { collections } from "../../constants/collections"


export const productVariantsLookupValues = {
    $lookup: {
        from: `${collections.ecommerce.products.productvariants.productvariants}`,
        let: { productId: "$productDetails._id", variantId: "$variantId" },
        pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$variantId"] } } }
        ],
        as: "productDetails.variantDetails"
    }
}

export const replaceProductLookupValues = {
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
}

export const multilanguageFieldsLookup = (languageId:any) => ({
    $lookup: {
        from: `${collections.multilanguagefieleds}`,
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

export const wishlistFinalProject = {
    $project: {
        languageValues: 0
    }
};
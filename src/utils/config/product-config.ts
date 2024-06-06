import { multiLanguageSources } from "../../constants/multi-languages";

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
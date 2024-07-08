import { multiLanguageSources } from "../../constants/multi-languages";


export const collectionsProductLookup = {
    $lookup: {
        from: 'multilanguagefieleds', // Ensure 'from' field is included
        let: { collectionsProductId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$sourceId', '$$collectionsProductId'] },
                            { $eq: ['$source', multiLanguageSources.website.collectionsProducts] },
                        ],
                    },
                },
            },
        ],
        as: 'languageValues',
    },
}

export const collectionProductlanguageFieldsReplace = {
    $addFields: {
        collectionTitle: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.collectionTitle", 0] }, null] }, null] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.collectionTitle", 0] }, ""] }, ""] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.collectionTitle", 0] }, "undefined"] }, "undefined"] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.collectionTitle", 0] }, undefined] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.collectionTitle', 0] }, ''] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.collectionTitle', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.collectionTitle', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.collectionTitle', 0] }, "undefined"] },
                    ]
                },
                then: '$collectionTitle',
                else: { $arrayElemAt: ['$languageValues.languageValues.collectionTitle', 0] }
            }
        },
        collectionSubTitle: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.collectionSubTitle", 0] }, null] }, null] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.collectionSubTitle", 0] }, ""] }, ""] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.collectionSubTitle", 0] }, "undefined"] }, "undefined"] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.collectionSubTitle", 0] }, undefined] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.collectionSubTitle', 0] }, ''] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.collectionSubTitle', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.collectionSubTitle', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.collectionSubTitle', 0] }, "undefined"] },
                    ]
                },
                then: '$collectionSubTitle',
                else: { $arrayElemAt: ['$languageValues.languageValues.collectionSubTitle', 0] }
            }
        },
        collectionImageUrl: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.collectionImageUrl", 0] }, null] }, null] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.collectionImageUrl", 0] }, ""] }, ""] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.collectionImageUrl", 0] }, "undefined"] }, "undefined"] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.collectionImageUrl", 0] }, undefined] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.collectionImageUrl', 0] }, ''] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.collectionImageUrl', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.collectionImageUrl', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.collectionImageUrl', 0] }, "undefined"] },
                    ]
                },
                then: '$collectionImageUrl',
                else: { $arrayElemAt: ['$languageValues.languageValues.collectionImageUrl', 0] }
            }
        },
    }
}

export const collectionsProductFinalProject = {
    $project: {
        languageValues: 0
    }
};
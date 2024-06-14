"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectionsBrandFinalProject = exports.collectionBrandlanguageFieldsReplace = exports.collectionsBrandLookup = void 0;
const multi_languages_1 = require("../../constants/multi-languages");
exports.collectionsBrandLookup = {
    $lookup: {
        from: 'multilanguagefieleds', // Ensure 'from' field is included
        let: { collectionsBrandId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$sourceId', '$$collectionsBrandId'] },
                            { $eq: ['$source', multi_languages_1.multiLanguageSources.website.collectionsBrands] },
                        ],
                    },
                },
            },
        ],
        as: 'languageValues',
    },
};
exports.collectionBrandlanguageFieldsReplace = {
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
        offer: {
            $ifNull: ['$offer', []]
        },
    }
};
exports.collectionsBrandFinalProject = {
    $project: {
        languageValues: 0
    }
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryFinalProject = exports.categoryProject = exports.categoryLanguageFieldsReplace = exports.categoryLookup = void 0;
const multi_languages_1 = require("../../constants/multi-languages");
exports.categoryLookup = {
    $lookup: {
        from: 'multilanguagefieleds', // Ensure 'from' field is included
        let: { categoryId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$sourceId', '$$categoryId'] },
                            { $eq: ['$source', multi_languages_1.multiLanguageSources.ecommerce.categories] },
                        ],
                    },
                },
            },
        ],
        as: 'languageValues',
    }
};
exports.categoryLanguageFieldsReplace = {
    $addFields: {
        categoryTitle: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.categoryTitle", 0] }, null] }, null] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.categoryTitle", 0] }, ""] }, ""] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.categoryTitle", 0] }, "undefined"] }, "undefined"] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.categoryTitle", 0] }, undefined] }, undefined] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.categoryTitle", 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.categoryTitle", 0] }, null] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.categoryTitle", 0] }, "undefined"] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.categoryTitle", 0] }, undefined] }
                    ]
                },
                then: "$categoryTitle",
                else: { $arrayElemAt: ["$languageValues.languageValues.categoryTitle", 0] }
            }
        },
        description: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.description", 0] }, null] }, null] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.description", 0] }, ""] }, ""] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.description", 0] }, "undefined"] }, "undefined"] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.description", 0] }, undefined] }, undefined] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.description", 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.description", 0] }, null] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.description", 0] }, "undefined"] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.description", 0] }, undefined] }
                    ]
                },
                then: "$description",
                else: { $arrayElemAt: ["$languageValues.languageValues.description", 0] }
            }
        },
        categoryImageUrl: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.categoryImageUrl", 0] }, null] }, null] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.categoryImageUrl", 0] }, ""] }, ""] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.categoryImageUrl", 0] }, "undefined"] }, "undefined"] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.categoryImageUrl", 0] }, undefined] }, undefined] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.categoryImageUrl", 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.categoryImageUrl", 0] }, null] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.categoryImageUrl", 0] }, "undefined"] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.categoryImageUrl", 0] }, undefined] }
                    ]
                },
                then: "$categoryImageUrl",
                else: { $arrayElemAt: ["$languageValues.languageValues.categoryImageUrl", 0] }
            },
        }
    }
};
exports.categoryProject = {
    $project: {
        _id: 1,
        categoryTitle: 1,
        slug: 1,
        level: 1,
        status: 1,
        description: 1,
        categoryImageUrl: 1,
        parentCategory: 1,
        corporateGiftsPriority: 1,
        type: 1,
        languageValues: { $ifNull: ['$languageValues', []] },
    }
};
exports.categoryFinalProject = {
    $project: {
        languageValues: 0
    }
};

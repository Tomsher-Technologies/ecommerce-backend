"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.brandFinalProject = exports.brandLanguageFieldsReplace = exports.brandLookup = void 0;
const multi_languages_1 = require("../../constants/multi-languages");
exports.brandLookup = {
    $lookup: {
        from: 'multilanguagefieleds', // Ensure 'from' field is included
        let: { brandId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$sourceId', '$$brandId'] },
                            { $eq: ['$source', multi_languages_1.multiLanguageSources.ecommerce.brands] },
                        ],
                    },
                },
            },
        ],
        as: 'languageValues',
    },
};
exports.brandLanguageFieldsReplace = {
    $addFields: {
        brandTitle: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.brandTitle", 0] }, null] }, null] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.brandTitle", 0] }, ""] }, ""] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.brandTitle", 0] }, "undefined"] }, "undefined"] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.brandTitle", 0] }, undefined] }, undefined] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.brandTitle", 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.brandTitle", 0] }, null] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.brandTitle", 0] }, "undefined"] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.brandTitle", 0] }, undefined] }
                    ]
                },
                then: "$brandTitle",
                else: { $arrayElemAt: ["$languageValues.languageValues.brandTitle", 0] }
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
        brandImageUrl: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.brandImageUrl", 0] }, null] }, null] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.brandImageUrl", 0] }, ""] }, ""] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.brandImageUrl", 0] }, "undefined"] }, "undefined"] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.brandImageUrl", 0] }, undefined] }, undefined] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.brandImageUrl", 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.brandImageUrl", 0] }, null] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.brandImageUrl", 0] }, "undefined"] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.brandImageUrl", 0] }, undefined] }
                    ]
                },
                then: "$brandImageUrl",
                else: { $arrayElemAt: ["$languageValues.languageValues.brandImageUrl", 0] }
            },
        },
        brandBannerImageUrl: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.brandBannerImageUrl", 0] }, null] }, null] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.brandBannerImageUrl", 0] }, ""] }, ""] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.brandBannerImageUrl", 0] }, "undefined"] }, "undefined"] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.brandBannerImageUrl", 0] }, undefined] }, undefined] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.brandBannerImageUrl", 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.brandBannerImageUrl", 0] }, null] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.brandBannerImageUrl", 0] }, "undefined"] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.brandBannerImageUrl", 0] }, undefined] }
                    ]
                },
                then: "$brandBannerImageUrl",
                else: { $arrayElemAt: ["$languageValues.languageValues.brandBannerImageUrl", 0] }
            }
        }
    }
};
exports.brandFinalProject = {
    $project: {
        languageValues: 0
    }
};

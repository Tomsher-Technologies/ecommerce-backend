

import { multiLanguageSources } from "../../constants/multi-languages";

export const categoryLookup = {
    $lookup: {
        from: 'multilanguagefieleds', // Ensure 'from' field is included
        let: { categoryId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$sourceId', '$$categoryId'] },
                            { $eq: ['$source', multiLanguageSources.ecommerce.categories] },
                        ],
                    },
                },
            },
        ],
        as: 'languageValues',
    }
}

export const categoryLanguageFieldsReplace = {
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
        },
        metaTitle: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.metaTitle", 0] }, null] }, null] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.metaTitle", 0] }, ""] }, ""] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.metaTitle", 0] }, "undefined"] }, "undefined"] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.metaTitle", 0] }, undefined] }, undefined] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.metaTitle", 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.metaTitle", 0] }, null] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.metaTitle", 0] }, "undefined"] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.metaTitle", 0] }, undefined] }
                    ]
                },
                then: "$metaTitle",
                else: { $arrayElemAt: ["$languageValues.languageValues.metaTitle", 0] }
            }
        },
        metaKeywords: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.metaKeywords", 0] }, null] }, null] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.metaKeywords", 0] }, ""] }, ""] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.metaKeywords", 0] }, "undefined"] }, "undefined"] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.metaKeywords", 0] }, undefined] }, undefined] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.metaKeywords", 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.metaKeywords", 0] }, null] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.metaKeywords", 0] }, "undefined"] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.metaKeywords", 0] }, undefined] }
                    ]
                },
                then: "$metaKeywords",
                else: { $arrayElemAt: ["$languageValues.languageValues.metaKeywords", 0] }
            }
        },
        metaDescription: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.metaDescription", 0] }, null] }, null] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.metaDescription", 0] }, ""] }, ""] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.metaDescription", 0] }, "undefined"] }, "undefined"] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.metaDescription", 0] }, undefined] }, undefined] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.metaDescription", 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.metaDescription", 0] }, null] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.metaDescription", 0] }, "undefined"] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.metaDescription", 0] }, undefined] }
                    ]
                },
                then: "$metaDescription",
                else: { $arrayElemAt: ["$languageValues.languageValues.metaDescription", 0] }
            }
        },
        ogTitle: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.ogTitle", 0] }, null] }, null] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.ogTitle", 0] }, ""] }, ""] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.ogTitle", 0] }, "undefined"] }, "undefined"] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.ogTitle", 0] }, undefined] }, undefined] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.ogTitle", 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.ogTitle", 0] }, null] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.ogTitle", 0] }, "undefined"] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.ogTitle", 0] }, undefined] }
                    ]
                },
                then: "$ogTitle",
                else: { $arrayElemAt: ["$languageValues.languageValues.ogTitle", 0] }
            }
        },
        ogDescription: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.ogDescription", 0] }, null] }, null] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.ogDescription", 0] }, ""] }, ""] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.ogDescription", 0] }, "undefined"] }, "undefined"] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.ogDescription", 0] }, undefined] }, undefined] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.ogDescription", 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.ogDescription", 0] }, null] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.ogDescription", 0] }, "undefined"] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.ogDescription", 0] }, undefined] }
                    ]
                },
                then: "$ogDescription",
                else: { $arrayElemAt: ["$languageValues.languageValues.ogDescription", 0] }
            }
        },
        twitterTitle: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.twitterTitle", 0] }, null] }, null] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.twitterTitle", 0] }, ""] }, ""] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.twitterTitle", 0] }, "undefined"] }, "undefined"] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.twitterTitle", 0] }, undefined] }, undefined] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.twitterTitle", 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.twitterTitle", 0] }, null] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.twitterTitle", 0] }, "undefined"] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.twitterTitle", 0] }, undefined] }
                    ]
                },
                then: "$twitterTitle",
                else: { $arrayElemAt: ["$languageValues.languageValues.twitterTitle", 0] }
            }
        },
        twitterDescription: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.twitterDescription", 0] }, null] }, null] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.twitterDescription", 0] }, ""] }, ""] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.twitterDescription", 0] }, "undefined"] }, "undefined"] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.twitterDescription", 0] }, undefined] }, undefined] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.twitterDescription", 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.twitterDescription", 0] }, null] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.twitterDescription", 0] }, "undefined"] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.twitterDescription", 0] }, undefined] }
                    ]
                },
                then: "$twitterDescription",
                else: { $arrayElemAt: ["$languageValues.languageValues.twitterDescription", 0] }
            }
        },
    }
}

export const categoryProject = {
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
        metaTitle: 1,
        metaKeywords: 1,
        metaDescription: 1,
        ogTitle: 1,
        ogDescription: 1,
        twitterTitle: 1,
        twitterDescription: 1,
        languageValues: { $ifNull: ['$languageValues', []] },
    }
}
export const categoryFinalProject = {
    $project: {
        languageValues: 0
    }
};
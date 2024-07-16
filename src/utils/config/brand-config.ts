import { multiLanguageSources } from "../../constants/multi-languages";

export const multilanguagefieledsBrandLookup = {
    $lookup: {
        from: 'multilanguagefieleds', // Ensure 'from' field is included
        let: { brandId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$sourceId', '$$brandId'] },
                            { $eq: ['$source', multiLanguageSources.ecommerce.brands] },
                        ],
                    },
                },
            },
        ],
        as: 'languageValues',
    },
};

export const brandLanguageFieldsReplace = {
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
export const brandProject = {
    $project: {
        _id: 1,
        brandTitle: 1,
        slug: 1,
        level: 1,
        status: 1,
        description: 1,
        brandImageUrl: 1,
        brandBannerImageUrl: 1,
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

export const brandFinalProject = {
    $project: {
        languageValues: 0
    }
};
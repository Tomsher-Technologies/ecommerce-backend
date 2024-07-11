import { multiLanguageSources } from "../../constants/multi-languages";

export const pageMultilanguageFieldsLookup = {
    $lookup: {
        from: 'multilanguagefieleds', // Ensure 'from' field is included
        let: { pageId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$sourceId', '$$pageId'] },
                        ],
                    },
                },
            },
        ],
        as: 'languageValues',
    },
};

export const pageHomeAddFieldsStage = {
    $addFields: {
        'blockValues.metaTitle': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaTitle', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaTitle', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaTitle', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaTitle', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.metaTitle',
                else: { $arrayElemAt: ['$languageValues.languageValues.metaTitle', 0] }
            }
        },
        'blockValues.metaKeywords': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaKeywords', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaKeywords', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaKeywords', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaKeywords', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.metaKeywords',
                else: { $arrayElemAt: ['$languageValues.languageValues.metaKeywords', 0] }
            }
        },
        'blockValues.metaDescription': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaDescription', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaDescription', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaDescription', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaDescription', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.metaDescription',
                else: { $arrayElemAt: ['$languageValues.languageValues.metaDescription', 0] }
            }
        },
        'blockValues.ogTitle': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.ogTitle', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.ogTitle', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.ogTitle', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.ogTitle', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.ogTitle',
                else: { $arrayElemAt: ['$languageValues.languageValues.ogTitle', 0] }
            }
        },
        'blockValues.ogDescription': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.ogDescription', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.ogDescription', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.ogDescription', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.ogDescription', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.ogDescription',
                else: { $arrayElemAt: ['$languageValues.languageValues.ogDescription', 0] }
            }
        },
        'blockValues.twitterTitle': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.twitterTitle', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.twitterTitle', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.twitterTitle', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.twitterTitle', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.twitterTitle',
                else: { $arrayElemAt: ['$languageValues.languageValues.twitterTitle', 0] }
            }
        },
        'blockValues.twitterDescription': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.twitterDescription', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.twitterDescription', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.twitterDescription', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.twitterDescription', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.twitterDescription',
                else: { $arrayElemAt: ['$languageValues.languageValues.twitterDescription', 0] }
            }
        },
    },
};

export const pageContsctUsAddFieldsStage = {
    $addFields: {
        'blockValues.metaTitle': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaTitle', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaTitle', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaTitle', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaTitle', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.metaTitle',
                else: { $arrayElemAt: ['$languageValues.languageValues.metaTitle', 0] }
            }
        },
        'blockValues.metaKeywords': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaKeywords', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaKeywords', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaKeywords', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaKeywords', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.metaKeywords',
                else: { $arrayElemAt: ['$languageValues.languageValues.metaKeywords', 0] }
            }
        },
        'blockValues.metaDescription': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaDescription', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaDescription', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaDescription', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaDescription', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.metaDescription',
                else: { $arrayElemAt: ['$languageValues.languageValues.metaDescription', 0] }
            }
        },
        'blockValues.ogTitle': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.ogTitle', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.ogTitle', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.ogTitle', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.ogTitle', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.ogTitle',
                else: { $arrayElemAt: ['$languageValues.languageValues.ogTitle', 0] }
            }
        },
        'blockValues.ogDescription': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.ogDescription', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.ogDescription', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.ogDescription', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.ogDescription', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.ogDescription',
                else: { $arrayElemAt: ['$languageValues.languageValues.ogDescription', 0] }
            }
        },
        'blockValues.twitterTitle': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.twitterTitle', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.twitterTitle', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.twitterTitle', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.twitterTitle', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.twitterTitle',
                else: { $arrayElemAt: ['$languageValues.languageValues.twitterTitle', 0] }
            }
        },
        'blockValues.twitterDescription': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.twitterDescription', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.twitterDescription', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.twitterDescription', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.twitterDescription', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.twitterDescription',
                else: { $arrayElemAt: ['$languageValues.languageValues.twitterDescription', 0] }
            }
        },
    },
};

export const pageTermsAndPrivacyAddFieldsStage = {
    $addFields: {
        'blockValues.title': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.title', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.title', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.title', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.title', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.title',
                else: { $arrayElemAt: ['$languageValues.languageValues.title', 0] }
            }
        },
        'blockValues.subTitle': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.subTitle', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.subTitle', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.subTitle', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.subTitle', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.subTitle',
                else: { $arrayElemAt: ['$languageValues.languageValues.subTitle', 0] }
            }
        },
        'blockValues.description': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.description', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.description', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.description', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.description', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.description',
                else: { $arrayElemAt: ['$languageValues.languageValues.description', 0] }
            }
        },
        'blockValues.title2': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.title2', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.title2', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.title2', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.title2', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.title2',
                else: { $arrayElemAt: ['$languageValues.languageValues.title2', 0] }
            }
        },
        'blockValues.subTitle2': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.subTitle2', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.subTitle2', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.subTitle2', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.subTitle2', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.subTitle2',
                else: { $arrayElemAt: ['$languageValues.languageValues.subTitle2', 0] }
            }
        },
        'blockValues.description2': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.description2', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.description2', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.description2', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.description2', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.description2',
                else: { $arrayElemAt: ['$languageValues.languageValues.description2', 0] }
            }
        },
        'blockValues.metaTitle': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaTitle', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaTitle', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaTitle', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaTitle', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.metaTitle',
                else: { $arrayElemAt: ['$languageValues.languageValues.metaTitle', 0] }
            }
        },
        'blockValues.metaKeywords': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaKeywords', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaKeywords', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaKeywords', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaKeywords', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.metaKeywords',
                else: { $arrayElemAt: ['$languageValues.languageValues.metaKeywords', 0] }
            }
        },
        'blockValues.metaDescription': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaDescription', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaDescription', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaDescription', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.metaDescription', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.metaDescription',
                else: { $arrayElemAt: ['$languageValues.languageValues.metaDescription', 0] }
            }
        },
        'blockValues.ogTitle': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.ogTitle', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.ogTitle', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.ogTitle', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.ogTitle', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.ogTitle',
                else: { $arrayElemAt: ['$languageValues.languageValues.ogTitle', 0] }
            }
        },
        'blockValues.ogDescription': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.ogDescription', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.ogDescription', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.ogDescription', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.ogDescription', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.ogDescription',
                else: { $arrayElemAt: ['$languageValues.languageValues.ogDescription', 0] }
            }
        },
        'blockValues.twitterTitle': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.twitterTitle', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.twitterTitle', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.twitterTitle', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.twitterTitle', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.twitterTitle',
                else: { $arrayElemAt: ['$languageValues.languageValues.twitterTitle', 0] }
            }
        },
        'blockValues.twitterDescription': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.twitterDescription', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.twitterDescription', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.twitterDescription', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.twitterDescription', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.twitterDescription',
                else: { $arrayElemAt: ['$languageValues.languageValues.twitterDescription', 0] }
            }
        },
    },
};

export const pageFinalProject = {
    $project: {
        languageValues: 0,
        'blockValues.languageValues': 0,
    }
};

export const replaceRootStage = {
    $replaceRoot: {
        newRoot: '$blockValues'
    }
};
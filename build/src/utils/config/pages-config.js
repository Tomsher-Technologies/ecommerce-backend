"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceRootStage = exports.pageFinalProject = exports.pageTermsAndPrivacyAddFieldsStage = exports.pageAboutUsAddFieldsStage = exports.pageContsctUsAddFieldsStage = exports.pageHomeAddFieldsStage = exports.pageMultilanguageFieldsLookup = void 0;
exports.pageMultilanguageFieldsLookup = {
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
exports.pageHomeAddFieldsStage = {
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
exports.pageContsctUsAddFieldsStage = {
    $addFields: {
        'blockValues.contactTitle': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.contactTitle', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.contactTitle', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.contactTitle', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.contactTitle', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.contactTitle',
                else: { $arrayElemAt: ['$languageValues.languageValues.contactTitle', 0] }
            }
        },
        'blockValues.subject': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.subject', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.subject', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.subject', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.subject', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.subject',
                else: { $arrayElemAt: ['$languageValues.languageValues.subject', 0] }
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
        'blockValues.contactImageUrl': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.contactImageUrl', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.contactImageUrl', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.contactImageUrl', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.contactImageUrl', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.contactImageUrl',
                else: { $arrayElemAt: ['$languageValues.languageValues.contactImageUrl', 0] }
            }
        },
        'blockValues.contactImageUrl2': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.contactImageUrl2', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.contactImageUrl2', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.contactImageUrl2', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.contactImageUrl2', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.contactImageUrl2',
                else: { $arrayElemAt: ['$languageValues.languageValues.contactImageUrl2', 0] }
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
exports.pageAboutUsAddFieldsStage = {
    $addFields: {
        'blockValues.aboutTitle': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.aboutTitle', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.aboutTitle', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.aboutTitle', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.aboutTitle', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.aboutTitle',
                else: { $arrayElemAt: ['$languageValues.languageValues.aboutTitle', 0] }
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
        'blockValues.aboutImageUrl': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.aboutImageUrl', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.aboutImageUrl', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.aboutImageUrl', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.aboutImageUrl', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.aboutImageUrl',
                else: { $arrayElemAt: ['$languageValues.languageValues.aboutImageUrl', 0] }
            }
        },
        'blockValues.aboutImageUrl2': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.aboutImageUrl2', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.aboutImageUrl2', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.aboutImageUrl2', 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.aboutImageUrl2', 0] }, "undefined"] }
                    ]
                },
                then: '$blockValues.aboutImageUrl2',
                else: { $arrayElemAt: ['$languageValues.languageValues.aboutImageUrl2', 0] }
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
exports.pageTermsAndPrivacyAddFieldsStage = {
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
exports.pageFinalProject = {
    $project: {
        languageValues: 0,
        'blockValues.languageValues': 0,
    }
};
exports.replaceRootStage = {
    $replaceRoot: {
        newRoot: '$blockValues'
    }
};

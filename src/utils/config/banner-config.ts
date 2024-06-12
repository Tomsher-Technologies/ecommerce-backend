import { multiLanguageSources } from "../../constants/multi-languages";

export const bannerLookup = {
    $lookup: {
        from: 'multilanguagefieleds', // Ensure 'from' field is included
        let: { bannerId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$sourceId', '$$bannerId'] },
                            { $eq: ['$source', multiLanguageSources.ecommerce.banner] },
                        ],
                    },
                },
            },
        ],
        as: 'languageValues',
    },
};

export const bannerProject = {
    $project: {
        _id: 1,
        countryId: 1,
        bannerTitle: 1,
        page: 1,
        pageReference: 1,
        linkType: 1,
        link: 1,
        description: 1,
        blocks: 1,
        bannerImages: 1,
        position: 1,
        status: 1,
        createdAt: 1,
        languageValues: { $ifNull: ['$languageValues', []] }
    }
}

export const bannerlanguageFieldsReplace = {
    $addFields: {
        bannerTitle: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.bannerTitle", 0] }, null] }, null] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.bannerTitle", 0] }, ""] }, ""] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.bannerTitle", 0] }, "undefined"] }, "undefined"] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.bannerTitle", 0] }, undefined] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.bannerTitle', 0] }, ''] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.bannerTitle', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.bannerTitle', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.bannerTitle', 0] }, "undefined"] },
                    ]
                },
                then: '$bannerTitle',
                else: { $arrayElemAt: ['$languageValues.languageValues.bannerTitle', 0] }
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
        bannerImages: {
            $cond: {
                if: {
                    $or: [
                        { $eq: ['$languageValues.languageValues.bannerImages', null] },
                        { $eq: ['$languageValues.languageValues.bannerImages', []] },
                        {
                            $and: [
                                { $isArray: '$languageValues.languageValues.bannerImages' },
                                { $eq: [{ $size: '$languageValues.languageValues.bannerImages' }, 1] },
                                { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.bannerImages', 0] }, []] }
                            ]
                        }
                    ]
                },
                then: '$bannerImages',
                else: {
                    $reduce: {
                        input: '$languageValues.languageValues.bannerImages',
                        initialValue: [],
                        in: {
                            $concatArrays: [
                                '$$value',
                                {
                                    $cond: {
                                        if: { $eq: ['$$this.bannerImageUrl', ''] },
                                        then: {
                                            bannerImageUrl: { $arrayElemAt: ['$bannerImages.bannerImageUrl', 0] },
                                            bannerImage: '$$this.bannerImage'
                                        },
                                        else: '$$this'
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        }
        // bannerImages: {
        //     $cond: {
        //         if: {
        //             $or: [
        //                 { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.bannerImages", 0] }, null] }, null] },
        //                 { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.bannerImages", 0] }, ""] }, ""] },
        //                 { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.bannerImages", 0] }, "undefined"] }, "undefined"] },
        //                 { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.bannerImages", 0] }, undefined] }, undefined] },
        //                 { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.bannerImages', 0] }, ''] },
        //                 { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.bannerImages', 0] }, null] },
        //                 { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.bannerImages', 0] }, undefined] },
        //                 { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.bannerImages', 0] }, "undefined"] },
        //             ]
        //         },
        //         then: '$bannerImages',
        //         else: { $arrayElemAt: ['$languageValues.languageValues.bannerImages', 0] }
        //     }
        // },
    }
}

export const bannerFinalProject = {
    $project: {
        languageValues: 0
    }
};
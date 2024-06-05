export const sliderlanguageFieldsReplace = {
    $addFields: {
        sliderTitle: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ['$languageValues.languageValues.sliderTitle', 0] }, null] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.sliderTitle', 0] }, ''] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.sliderTitle', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.sliderTitle', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.sliderTitle', 0] }, "undefined"] },
                    ]
                },
                then: '$sliderTitle',
                else: { $arrayElemAt: ['$languageValues.languageValues.sliderTitle', 0] }
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
        sliderImageUrl: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ['$languageValues.languageValues.sliderImageUrl', 0] }, null] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.sliderImageUrl', 0] }, ''] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.sliderImageUrl', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.sliderImageUrl', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.sliderImageUrl', 0] }, "undefined"] },
                    ]
                },
                then: '$sliderImageUrl',
                else: { $arrayElemAt: ['$languageValues.languageValues.sliderImageUrl', 0] }
            }
        },
    }
}

export const bannerlanguageFieldsReplace = {
    $addFields: {
        bannerTitle: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ['$languageValues.languageValues.bannerTitle', 0] }, null] }, null] },
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
        bannerImages: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ['$languageValues.languageValues.bannerImages', 0] }, null] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.bannerImages', 0] }, ''] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.bannerImages', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.bannerImages', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.bannerImages', 0] }, "undefined"] },
                    ]
                },
                then: '$bannerImages',
                else: { $arrayElemAt: ['$languageValues.languageValues.bannerImages', 0] }
            }
        },
    }
}

export const collectionProductlanguageFieldsReplace = {
    $addFields: {
        collectionTitle: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ['$languageValues.languageValues.collectionTitle', 0] }, null] }, null] },
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
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ['$languageValues.languageValues.collectionSubTitle', 0] }, null] }, null] },
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
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ['$languageValues.languageValues.collectionImageUrl', 0] }, null] }, null] },
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
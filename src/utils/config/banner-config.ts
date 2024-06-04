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

export const bannerFinalProject = {
    $project: {
        languageValues: 0
    }
};
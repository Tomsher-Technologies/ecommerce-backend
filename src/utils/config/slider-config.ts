// sliderConfig.ts

import { multiLanguageSources } from "../../constants/multi-languages";

export const sliderLookup = {
    $lookup: {
        from: 'multilanguagefieleds',
        let: { sliderId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$sourceId', '$$sliderId'] },
                            { $eq: ['$source', multiLanguageSources.ecommerce.sliders] },
                        ],
                    },
                },
            },
        ],
        as: 'languageValues',
    },
};

export const sliderProject = {
    $project: {
        _id: 1,
        countryId: 1,
        sliderTitle: 1,
        page: 1,
        pageReference: 1,
        linkType: 1,
        link: 1,
        description: 1,
        sliderImageUrl: 1,
        position: 1,
        status: 1,
        createdAt: 1,
        languageValues: { $ifNull: ['$languageValues', []] }
    }
};

export const sliderFinalProject = {
    $project: {
        languageValues: 0
    }
};
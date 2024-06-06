"use strict";
// sliderConfig.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.sliderFinalProject = exports.sliderProject = exports.sliderLookup = void 0;
const multi_languages_1 = require("../../constants/multi-languages");
exports.sliderLookup = {
    $lookup: {
        from: 'multilanguagefieleds',
        let: { sliderId: '$_id' }, // Assuming _id refers to the slider document
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$sourceId', '$$sliderId'] }, // Solution 1 or 2
                            { $eq: ['$source', multi_languages_1.multiLanguageSources.ecommerce.sliders] },
                        ],
                    },
                },
            },
        ],
        as: 'languageValues',
    },
};
exports.sliderProject = {
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
exports.sliderFinalProject = {
    $project: {
        languageValues: 0
    }
};

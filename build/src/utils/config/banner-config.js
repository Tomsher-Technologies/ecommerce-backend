"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bannerFinalProject = exports.bannerProject = exports.bannerLookup = void 0;
const multi_languages_1 = require("../../constants/multi-languages");
exports.bannerLookup = {
    $lookup: {
        from: 'multilanguagefieleds', // Ensure 'from' field is included
        let: { bannerId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$sourceId', '$$bannerId'] },
                            { $eq: ['$source', multi_languages_1.multiLanguageSources.ecommerce.banner] },
                        ],
                    },
                },
            },
        ],
        as: 'languageValues',
    },
};
exports.bannerProject = {
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
};
exports.bannerFinalProject = {
    $project: {
        languageValues: 0
    }
};

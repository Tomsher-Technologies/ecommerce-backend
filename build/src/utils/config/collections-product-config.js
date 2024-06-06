"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectionsProductFinalProject = exports.collectionsProductLookup = void 0;
const multi_languages_1 = require("../../constants/multi-languages");
exports.collectionsProductLookup = {
    $lookup: {
        from: 'multilanguagefieleds', // Ensure 'from' field is included
        let: { collectionsProductId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$sourceId', '$$collectionsProductId'] },
                            { $eq: ['$source', multi_languages_1.multiLanguageSources.website.collectionsProducts] },
                        ],
                    },
                },
            },
        ],
        as: 'languageValues',
    },
};
exports.collectionsProductFinalProject = {
    $project: {
        languageValues: 0
    }
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectionsBrandFinalProject = exports.collectionsBrandLookup = void 0;
const multi_languages_1 = require("../../constants/multi-languages");
exports.collectionsBrandLookup = {
    $lookup: {
        from: 'multilanguagefieleds', // Ensure 'from' field is included
        let: { collectionsBrandId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$sourceId', '$$collectionsBrandId'] },
                            { $eq: ['$source', multi_languages_1.multiLanguageSources.website.collectionsBrands] },
                        ],
                    },
                },
            },
        ],
        as: 'languageValues',
    },
};
exports.collectionsBrandFinalProject = {
    $project: {
        languageValues: 0
    }
};

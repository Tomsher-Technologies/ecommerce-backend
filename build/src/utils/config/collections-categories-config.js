"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectionsCategoryFinalProject = exports.collectionsCategoryLookup = void 0;
const multi_languages_1 = require("../../constants/multi-languages");
exports.collectionsCategoryLookup = {
    $lookup: {
        from: 'multilanguagefieleds', // Ensure 'from' field is included
        let: { collectionsCategoryId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$sourceId', '$$collectionsCategoryId'] },
                            { $eq: ['$source', multi_languages_1.multiLanguageSources.website.collectionsCategories] },
                        ],
                    },
                },
            },
        ],
        as: 'languageValues',
    },
};
exports.collectionsCategoryFinalProject = {
    $project: {
        languageValues: 0
    }
};

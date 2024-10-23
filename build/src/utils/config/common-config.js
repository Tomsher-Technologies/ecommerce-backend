"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seoLookup = exports.addLookupProject = void 0;
const collections_1 = require("../../constants/collections");
const addLookupProject = (lookup, projectFields) => {
    const clonedLookup = { ...lookup };
    clonedLookup.$lookup.pipeline = [
        {
            $project: projectFields
        }
    ];
    return clonedLookup;
};
exports.addLookupProject = addLookupProject;
const seoLookup = (alias) => {
    return {
        $lookup: {
            from: `${collections_1.collections.ecommerce.seopages}`,
            let: { currentPageId: '$_id' },
            pipeline: [
                {
                    $match: {
                        $expr: { $eq: ['$pageId', '$$currentPageId'] },
                        'pageReferenceId': null
                    }
                }
            ],
            as: alias,
        },
    };
};
exports.seoLookup = seoLookup;

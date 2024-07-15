"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seoLookup = void 0;
const collections_1 = require("../../constants/collections");
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

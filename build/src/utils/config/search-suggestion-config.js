"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchSuggestionBrandsLookup = exports.searchSuggestionCategoryLookup = exports.searchSuggestionProductsLookup = exports.topSearchesLookup = void 0;
exports.topSearchesLookup = [
    {
        $group: {
            _id: "$searchQuery",
            searchCount: { $sum: "$searchCount" }
        }
    },
    {
        $sort: { searchCount: -1 } // Use -1 for descending order
    },
    {
        $limit: 10
    },
    {
        $project: {
            _id: 0,
            searchQuery: "$_id",
            searchCount: 1
        }
    }
];
exports.searchSuggestionProductsLookup = [
    {
        $match: { status: '1' }
    },
    {
        $addFields: {
            wordsArray: { $split: ["$productTitle", " "] }
        }
    },
    {
        $addFields: {
            firstFiveWords: { $slice: ["$wordsArray", 3] }
        }
    },
    {
        $addFields: {
            truncatedTitle: {
                $reduce: {
                    input: "$firstFiveWords",
                    initialValue: "",
                    in: {
                        $cond: {
                            if: { $eq: ["$$value", ""] },
                            then: "$$this",
                            else: { $concat: ["$$value", " ", "$$this"] }
                        }
                    }
                }
            }
        }
    },
    {
        $group: {
            _id: "$truncatedTitle",
            productTitle: { $first: "$truncatedTitle" }
        }
    },
    {
        $project: {
            _id: 0,
            productTitle: 1
        }
    }
];
exports.searchSuggestionCategoryLookup = [
    {
        $group: {
            _id: null,
            categoryTitle: { $addToSet: "$categoryTitle" }
        }
    },
    {
        $unwind: "$categoryTitle"
    },
    {
        $project: {
            _id: 0,
            categoryTitle: 1
        }
    }
];
exports.searchSuggestionBrandsLookup = [
    {
        $group: {
            _id: null,
            brandTitle: { $addToSet: "$brandTitle" }
        }
    },
    {
        $unwind: "$brandTitle"
    },
    {
        $project: {
            _id: 0,
            brandTitle: 1
        }
    }
];

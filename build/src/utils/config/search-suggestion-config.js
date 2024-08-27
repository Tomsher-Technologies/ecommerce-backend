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
        $sort: { searchCount: -1 }
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
        $limit: 7
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
        $limit: 7
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
        $limit: 7
    },
    {
        $project: {
            _id: 0,
            brandTitle: 1
        }
    }
];
// const searchQuery = query as string;
// const productsPromise = ProductsModel.find({ status: '1' }).exec();
// const brandsPromise = BrandsModel.find({}).exec();
// const categoriesPromise = CategoryModel.find({}).exec();
// const [products, brands, categories] = await Promise.all([
//     productsPromise,
//     brandsPromise,
//     categoriesPromise
// ]);
// const fuseProducts = new Fuse(products, {
//     keys: ['productTitle'],
//     includeScore: true,
//     threshold: 0.4
// });
// const fuseBrands = new Fuse(brands, {
//     keys: ['brandTitle'],
//     includeScore: true,
//     threshold: 0.4
// });
// const fuseCategories = new Fuse(categories, {
//     keys: ['categoryTitle'],
//     includeScore: true,
//     threshold: 0.4
// });
// const productResults = fuseProducts.search(searchQuery).map(result => result.item);
// const brandResults = fuseBrands.search(searchQuery).map(result => result.item);
// const categoryResults = fuseCategories.search(searchQuery).map(result => result.item);
// const seenTitles = new Set<string>();
// const maxWords = 6;
// const uniqueProducts = productResults
//     .map(product => ({
//         ...product,
//         productTitle: truncateWord(product.productTitle, maxWords)
//     }))
//     .filter(product => {
//         const normalizedTitle = normalizeWord(product.productTitle);
//         if (seenTitles.has(normalizedTitle)) {
//             return false;
//         }
//         seenTitles.add(normalizedTitle);
//         return true;
//     })
//     .map(product => ({
//         productTitle: truncateWord(product.productTitle, maxWords)
//     }));
// results = {
//     products: uniqueProducts,

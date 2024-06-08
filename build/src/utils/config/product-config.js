"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attributeProject = exports.attributeDetailLanguageFieldsReplace = exports.attributeLanguageFieldsReplace = exports.attributeDetailLookup = exports.attributeLookup = exports.productFinalProject = exports.productlanguageFieldsReplace = exports.productMultilanguageFieldsLookup = void 0;
const multi_languages_1 = require("../../constants/multi-languages");
exports.productMultilanguageFieldsLookup = {
    $lookup: {
        from: 'multilanguagefieleds', // Ensure 'from' field is included
        let: { productId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$sourceId', '$$productId'] },
                            { $eq: ['$source', multi_languages_1.multiLanguageSources.ecommerce.products] },
                        ],
                    },
                },
            },
        ],
        as: 'languageValues',
    },
};
exports.productlanguageFieldsReplace = {
    $addFields: {
        productTitle: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ['$languageValues.languageValues.productTitle', 0] }, null] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.productTitle', 0] }, ''] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.productTitle', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.productTitle', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.productTitle', 0] }, "undefined"] },
                    ]
                },
                then: '$productTitle',
                else: { $arrayElemAt: ['$languageValues.languageValues.productTitle', 0] }
            }
        },
        productImageUrl: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ['$languageValues.languageValues.productImageUrl', 0] }, null] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.productImageUrl', 0] }, ''] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.productImageUrl', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.productImageUrl', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.productImageUrl', 0] }, "undefined"] },
                    ]
                },
                then: '$productImageUrl',
                else: { $arrayElemAt: ['$languageValues.languageValues.productImageUrl', 0] }
            }
        },
        description: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ['$languageValues.languageValues.description', 0] }, null] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.description', 0] }, ''] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.description', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.description', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.description', 0] }, "undefined"] },
                    ]
                },
                then: '$description',
                else: { $arrayElemAt: ['$languageValues.languageValues.description', 0] }
            }
        },
        longDescription: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ['$languageValues.languageValues.longDescription', 0] }, null] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.longDescription', 0] }, ''] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.longDescription', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.longDescription', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.longDescription', 0] }, "undefined"] },
                    ]
                },
                then: '$longDescription',
                else: { $arrayElemAt: ['$languageValues.languageValues.longDescription', 0] }
            }
        },
    }
};
exports.productFinalProject = {
    $project: {
        languageValues: 0
    }
};
exports.attributeLookup = {
    $lookup: {
        from: 'multilanguagefieleds', // Ensure 'from' field is included
        let: { attributeId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$sourceId', '$$attributeId'] },
                            { $eq: ['$source', multi_languages_1.multiLanguageSources.ecommerce.attributes] },
                        ],
                    },
                },
            },
        ],
        as: 'languageValues',
    }
};
exports.attributeDetailLookup = {
    $lookup: {
        from: 'multilanguagefieleds', // Ensure 'from' field is included
        let: { attributeDetailId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$sourceId', '$$attributeDetailId'] },
                            { $eq: ['$source', multi_languages_1.multiLanguageSources.ecommerce.attributedetails] },
                        ],
                    },
                },
            },
        ],
        as: 'languageValues',
    }
};
exports.attributeLanguageFieldsReplace = {
    $addFields: {
        attributeTitle: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.attributeTitle", 0] }, null] }, null] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.attributeTitle", 0] }, ""] }, ""] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.attributeTitle", 0] }, "undefined"] }, "undefined"] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.attributeTitle", 0] }, undefined] }, undefined] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.attributeTitle", 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.attributeTitle", 0] }, null] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.attributeTitle", 0] }, "undefined"] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.attributeTitle", 0] }, undefined] }
                    ]
                },
                then: "$attributeTitle",
                else: { $arrayElemAt: ["$languageValues.languageValues.attributeTitle", 0] }
            }
        },
        'attributeValues': {
            $map: {
                input: "$attributeValues",
                as: "attrValue",
                in: {
                    $mergeObjects: [
                        "$$attrValue",
                        {
                            itemName: {
                                $cond: {
                                    if: { $isArray: "$$attrValue.itemName" },
                                    then: { $arrayElemAt: ["$$attrValue.itemName", "$$index"] },
                                    else: "$$attrValue.itemName"
                                }
                            }
                        }
                    ]
                }
            }
        }
    }
};
exports.attributeDetailLanguageFieldsReplace = {
    $addFields: {
        'attributeValues.itemName': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.attributeValues.itemName", 0] }, null] }, null] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.attributeValues.itemName", 0] }, ""] }, ""] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.attributeValues.itemName", 0] }, "undefined"] }, "undefined"] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.attributeValues.itemName", 0] }, undefined] }, undefined] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.attributeValues.itemName", 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.attributeValues.itemName", 0] }, null] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.attributeValues.itemName", 0] }, "undefined"] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.attributeValues.itemName", 0] }, undefined] }
                    ]
                },
                then: "$attributeValues.itemName",
                else: { $arrayElemAt: ["$languageValues.languageValues.attributeValues.itemName", 0] }
            }
        }
    }
};
exports.attributeProject = {
    $project: {
        _id: 1,
        attributeTitle: 1,
        slug: 1,
        attributeType: 1,
        status: 1,
        createdAt: 1,
        attributeValues: {
            $ifNull: ['$attributeValues', []]
        },
        languageValues: {
            $ifNull: ['$languageValues', []]
        }
    }
};

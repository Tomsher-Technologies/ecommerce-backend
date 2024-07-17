"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.frontendVariantAttributesLookup = exports.attributeProject = exports.attributeDetailLanguageFieldsReplace = exports.attributeLanguageFieldsReplace = exports.attributeLookup = exports.attributeDetailsLookup = void 0;
const collections_1 = require("../../constants/collections");
const multi_languages_1 = require("../../constants/multi-languages");
exports.attributeDetailsLookup = {
    $lookup: {
        from: `${collections_1.collections.ecommerce.attributedetails}`, // Collection name of AttributeDetailModel
        localField: '_id', // Field in AttributesModel
        foreignField: 'attributeId', // Field in AttributeDetailModel
        as: 'attributeValues'
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
const frontendVariantAttributesLookup = (match) => {
    return [
        {
            $match: match
        },
        {
            $lookup: {
                from: `${collections_1.collections.ecommerce.attributes}`,
                localField: 'attributeId',
                foreignField: '_id',
                as: 'attribute'
            }
        },
        {
            $unwind: "$attribute"
        },
        {
            $lookup: {
                from: `${collections_1.collections.ecommerce.attributedetails}`,
                localField: 'attributeDetailId',
                foreignField: '_id',
                as: 'attributeDetail'
            }
        },
        {
            $unwind: "$attributeDetail"
        },
        {
            $project: {
                _id: 1,
                variantId: 1,
                attributeId: '$attribute._id',
                attributeTitle: '$attribute.attributeTitle',
                slug: '$attribute.slug',
                attributeType: '$attribute.attributeType',
                attributeDetail: 1
            }
        }
    ];
};
exports.frontendVariantAttributesLookup = frontendVariantAttributesLookup;

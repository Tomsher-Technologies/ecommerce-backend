"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.frontendSpecificationLookup = exports.specificationProject = exports.specificationDetailLanguageFieldsReplace = exports.specificationLanguageFieldsReplace = exports.specificationLanguageLookup = exports.specificationDetailsLookup = void 0;
const collections_1 = require("../../constants/collections");
const multi_languages_1 = require("../../constants/multi-languages");
exports.specificationDetailsLookup = {
    $lookup: {
        from: 'specificationdetails', // Collection name of AttributeDetailModel
        localField: '_id', // Field in AttributesModel
        foreignField: 'specificationId', // Field in AttributeDetailModel
        as: 'specificationValues'
    }
};
exports.specificationLanguageLookup = {
    $lookup: {
        from: 'multilanguagefieleds', // Ensure 'from' field is included
        let: { specificationId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$sourceId', '$$specificationId'] },
                            { $eq: ['$source', multi_languages_1.multiLanguageSources.ecommerce.specifications] },
                        ],
                    },
                },
            },
        ],
        as: 'languageValues',
    }
};
exports.specificationLanguageFieldsReplace = {
    $addFields: {
        specificationTitle: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.specificationTitle", 0] }, null] }, null] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.specificationTitle", 0] }, ""] }, ""] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.specificationTitle", 0] }, "undefined"] }, "undefined"] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.specificationTitle", 0] }, undefined] }, undefined] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.specificationTitle", 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.specificationTitle", 0] }, null] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.specificationTitle", 0] }, "undefined"] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.specificationTitle", 0] }, undefined] }
                    ]
                },
                then: "$specificationTitle",
                else: { $arrayElemAt: ["$languageValues.languageValues.specificationTitle", 0] }
            }
        },
    }
};
exports.specificationDetailLanguageFieldsReplace = {
    $addFields: {
        'specificationValues.itemName': {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.specificationValues.itemName", 0] }, null] }, null] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.specificationValues.itemName", 0] }, ""] }, ""] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.specificationValues.itemName", 0] }, "undefined"] }, "undefined"] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.specificationValues.itemName", 0] }, undefined] }, undefined] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.specificationValues.itemName", 0] }, ""] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.specificationValues.itemName", 0] }, null] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.specificationValues.itemName", 0] }, "undefined"] },
                        { $eq: [{ $arrayElemAt: ["$languageValues.languageValues.specificationValues.itemName", 0] }, undefined] }
                    ]
                },
                then: "$specificationValues.itemName",
                else: { $arrayElemAt: ["$languageValues.languageValues.specificationValues.itemName", 0] }
            }
        }
    }
};
exports.specificationProject = {
    $project: {
        _id: 1,
        specificationTitle: 1,
        slug: 1,
        specificationType: 1,
        status: 1,
        createdAt: 1,
        specificationValues: {
            $ifNull: ['$specificationValues', []]
        },
        languageValues: {
            $ifNull: ['$languageValues', []]
        }
    }
};
const frontendSpecificationLookup = (match) => {
    return [
        {
            $match: match
        },
        {
            $lookup: {
                from: `${collections_1.collections.ecommerce.specifications}`,
                localField: 'specificationId',
                foreignField: '_id',
                as: 'specification'
            }
        },
        {
            $unwind: "$specification"
        },
        {
            $lookup: {
                from: `${collections_1.collections.ecommerce.specificationdetails}`,
                localField: 'specificationDetailId',
                foreignField: '_id',
                as: 'specificationDetail'
            }
        },
        {
            $unwind: "$specificationDetail"
        },
        {
            $sort: { "specification.createdAt": 1 }
        },
        {
            $project: {
                _id: 1,
                variantId: 1,
                specificationId: '$specification._id',
                specificationTitle: '$specification.specificationTitle',
                specificationDisplayName: '$specification.specificationDisplayName',
                enableTab: '$specification.enableTab',
                slug: '$specification.slug',
                specificationDetail: '$specificationDetail',
                createdAt: '$specification.createdAt'
            }
        }
    ];
};
exports.frontendSpecificationLookup = frontendSpecificationLookup;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentMethodFinalProject = exports.paymentMethodlanguageFieldsReplace = exports.customPaymentMethodProject = exports.paymentMethodProject = exports.paymentMethodLookup = void 0;
const multi_languages_1 = require("../../constants/multi-languages");
exports.paymentMethodLookup = {
    $lookup: {
        from: 'multilanguagefieleds', // Ensure 'from' field is included
        let: { paymentMethodId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$sourceId', '$$paymentMethodId'] },
                            { $eq: ['$source', multi_languages_1.multiLanguageSources.setup.paymentMethod] },
                        ],
                    },
                },
            },
        ],
        as: 'languageValues',
    },
};
exports.paymentMethodProject = {
    $project: {
        _id: 1,
        countryId: 1,
        paymentMethodTitle: 1,
        subTitle: 1,
        description: 1,
        paymentMethodValues: 1,
        enableDisplay: 1,
        paymentMethodImageUrl: 1,
        status: 1,
        languageValues: { $ifNull: ['$languageValues', []] }
    }
};
exports.customPaymentMethodProject = {
    $project: {
        _id: 1,
        countryId: 1,
        paymentMethodTitle: 1,
        subTitle: 1,
        description: 1,
        enableDisplay: 1,
        paymentMethodImageUrl: 1,
        status: 1,
        languageValues: { $ifNull: ['$languageValues', []] }
    }
};
exports.paymentMethodlanguageFieldsReplace = {
    $addFields: {
        paymentMethodTitle: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.paymentMethodTitle", 0] }, null] }, null] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.paymentMethodTitle", 0] }, ""] }, ""] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.paymentMethodTitle", 0] }, "undefined"] }, "undefined"] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.paymentMethodTitle", 0] }, undefined] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.paymentMethodTitle', 0] }, ''] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.paymentMethodTitle', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.paymentMethodTitle', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.paymentMethodTitle', 0] }, "undefined"] },
                    ]
                },
                then: '$paymentMethodTitle',
                else: { $arrayElemAt: ['$languageValues.languageValues.paymentMethodTitle', 0] }
            }
        },
        subTitle: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.subTitle", 0] }, null] }, null] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.subTitle", 0] }, ""] }, ""] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.subTitle", 0] }, "undefined"] }, "undefined"] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.subTitle", 0] }, undefined] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.subTitle', 0] }, ''] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.subTitle', 0] }, null] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.subTitle', 0] }, undefined] },
                        { $eq: [{ $arrayElemAt: ['$languageValues.languageValues.subTitle', 0] }, "undefined"] },
                    ]
                },
                then: '$subTitle',
                else: { $arrayElemAt: ['$languageValues.languageValues.subTitle', 0] }
            }
        },
        description: {
            $cond: {
                if: {
                    $or: [
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.description", 0] }, null] }, null] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.description", 0] }, ""] }, ""] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.description", 0] }, "undefined"] }, "undefined"] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ["$languageValues.languageValues.description", 0] }, undefined] }, undefined] },
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
    }
};
exports.paymentMethodFinalProject = {
    $project: {
        languageValues: 0
    }
};

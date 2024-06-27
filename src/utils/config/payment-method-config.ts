import { multiLanguageSources } from "../../constants/multi-languages";

export const paymentMethodLookup = {
    $lookup: {
        from: 'multilanguagefieleds', // Ensure 'from' field is included
        let: { paymentMethodId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$sourceId', '$$paymentMethodId'] },
                            { $eq: ['$source', multiLanguageSources.setup.paymentMethod] },
                        ],
                    },
                },
            },
        ],
        as: 'languageValues',
    },
};

export const paymentMethodProject = {
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
}
export const customPaymentMethodProject = {
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
}

export const paymentMethodlanguageFieldsReplace = {
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
}

export const paymentMethodFinalProject = {
    $project: {
        languageValues: 0
    }
};
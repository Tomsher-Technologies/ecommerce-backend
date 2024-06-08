import { multiLanguageSources } from "../../constants/multi-languages";

export const productMultilanguageFieldsLookup = {
    $lookup: {
        from: 'multilanguagefieleds', // Ensure 'from' field is included
        let: { productId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$sourceId', '$$productId'] },
                            { $eq: ['$source', multiLanguageSources.ecommerce.products] },
                        ],
                    },
                },
            },
        ],
        as: 'languageValues',
    },
};

export const productlanguageFieldsReplace = {
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
}

export const productFinalProject = {
    $project: {
        languageValues: 0
    }
};

export const attributeLookup = {
    $lookup: {
        from: 'multilanguagefieleds', // Ensure 'from' field is included
        let: { attributeId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$sourceId', '$$attributeId'] },
                            { $eq: ['$source', multiLanguageSources.ecommerce.attributes] },
                        ],
                    },
                },
            },
        ],
        as: 'languageValues',
    }
}

export const attributeDetailLookup = {
    $lookup: {
        from: 'multilanguagefieleds', // Ensure 'from' field is included
        let: { attributeDetailId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$sourceId', '$$attributeDetailId'] },
                            { $eq: ['$source', multiLanguageSources.ecommerce.attributedetails] },
                        ],
                    },
                },
            },
        ],
        as: 'languageValues',
    }
}

export const attributeLanguageFieldsReplace = {
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

}

export const attributeDetailLanguageFieldsReplace = {
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
}
export const attributeProject = {
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
}


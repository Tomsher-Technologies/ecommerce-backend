import { collections } from "../../constants/collections";
import { multiLanguageSources } from "../../constants/multi-languages"

export const attributeDetailsLookup = {
    $lookup: {
        from: `${collections.ecommerce.attributedetails}`, // Collection name of AttributeDetailModel
        localField: '_id', // Field in AttributesModel
        foreignField: 'attributeId', // Field in AttributeDetailModel
        as: 'attributeValues'
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

export const frontendVariantAttributesLookup = (match: any) => {
    return [
        {
            $match: match
        },
        {
            $lookup: {
                from: `${collections.ecommerce.attributes}`,
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
                from: `${collections.ecommerce.attributedetails}`,
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
    ]
}

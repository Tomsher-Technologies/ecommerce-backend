

import { multiLanguageSources } from "../../constants/multi-languages";

export const categoryLookup = {
    $lookup: {
        from: 'multilanguagefieleds', // Ensure 'from' field is included
        let: { categoryId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$sourceId', '$$categoryId'] },
                            { $eq: ['$source', multiLanguageSources.ecommerce.categories] },
                        ],
                    },
                },
            },
        ],
        as: 'languageValues',
    }
}

export const categoryProject = {
    $project: {
        _id: 1,
        categoryTitle: 1,
        slug: 1,
        level: 1,
        status: 1,
        description: 1,
        categoryImageUrl: 1,
        parentCategory: 1,
        corporateGiftsPriority: 1,
        type: 1,
        languageValues: { $ifNull: ['$languageValues', []] },
    }
}
export const categoryFinalProject = {
    $project: {
        languageValues: 0
    }
};
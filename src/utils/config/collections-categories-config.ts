import { multiLanguageSources } from "../../constants/multi-languages";

export const collectionsCategoryLookup = {
    $lookup: {
        from: 'multilanguagefieleds', // Ensure 'from' field is included
        let: { collectionsCategoryId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$sourceId', '$$collectionsCategoryId'] },
                            { $eq: ['$source', multiLanguageSources.website.collectionsCategories] },
                        ],
                    },
                },
            },
        ],
        as: 'languageValues',
    },
}

export const collectionsCategoryFinalProject = {
    $project: {
        languageValues: 0
    }
};
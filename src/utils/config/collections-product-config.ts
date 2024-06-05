import { multiLanguageSources } from "../../constants/multi-languages";


export const collectionsProductLookup = {
    $lookup: {
        from: 'multilanguagefieleds', // Ensure 'from' field is included
        let: { collectionsProductId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$sourceId', '$$collectionsProductId'] },
                            { $eq: ['$source', multiLanguageSources.website.collectionsProducts] },
                        ],
                    },
                },
            },
        ],
        as: 'languageValues',
    },
}

export const collectionsProductFinalProject = {
    $project: {
        languageValues: 0
    }
};
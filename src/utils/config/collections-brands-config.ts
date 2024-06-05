import { multiLanguageSources } from "../../constants/multi-languages";

export const collectionsBrandLookup = {
    $lookup: {
        from: 'multilanguagefieleds', // Ensure 'from' field is included
        let: { collectionsBrandId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$sourceId', '$$collectionsBrandId'] },
                            { $eq: ['$source', multiLanguageSources.website.collectionsBrands] },
                        ],
                    },
                },
            },
        ],
        as: 'languageValues',
    },
}

export const collectionsBrandFinalProject = {
    $project: {
        languageValues: 0
    }
};
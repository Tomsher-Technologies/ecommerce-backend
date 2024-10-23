import { collections } from "../../constants/collections";

export const addLookupProject = (lookup: any, projectFields: any) => {
    const clonedLookup = { ...lookup };
    clonedLookup.$lookup.pipeline = [
        {
            $project: projectFields
        }
    ];
    
    return clonedLookup;
};

export const seoLookup = (alias: string) => {
    return {
        $lookup: {
            from: `${collections.ecommerce.seopages}`,
            let: { currentPageId: '$_id' },
            pipeline: [
                {
                    $match: {
                        $expr: { $eq: ['$pageId', '$$currentPageId'] },
                        'pageReferenceId': null
                    }
                }
            ],
            as: alias,
        },
    }
};
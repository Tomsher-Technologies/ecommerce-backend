import { collections } from "../../constants/collections";


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
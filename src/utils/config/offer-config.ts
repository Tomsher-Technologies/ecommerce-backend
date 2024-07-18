


export const offerProductPopulation = (getOfferList: any, offerApplied: any) => {
    let pipeline = {
        $addFields: {
            productOffers: {
                $filter: {
                    input: getOfferList,
                    as: "offer",
                    cond: {
                        $and: [
                            { $in: ["$$offer._id", offerApplied.offerId] }, // Match offer ID
                            {
                                $in: [
                                    "$_id",
                                    { $map: { input: "$$offer.offerApplyValues", as: "id", in: { $toObjectId: "$$id" } } }
                                ]
                            }
                        ]
                    }
                }
            }
        }
    }
    return pipeline
}

export const offerCategoryPopulation = (getOfferList: any, offerApplied: any) => {
    return {
        $addFields: {
            categoryOffers: {
                $filter: {
                    input: getOfferList,
                    as: "offer",
                    cond: {
                        $and: [
                            { $in: ["$$offer._id", offerApplied.offerId] }, // Match offer ID
                            {
                                $gt: [
                                    {
                                        $size: {
                                            $filter: {
                                                input: "$productCategory.category",
                                                as: "cat",
                                                cond: {
                                                    $in: ["$$cat._id", { $map: { input: "$$offer.offerApplyValues", as: "id", in: { $toObjectId: "$$id" } } }]
                                                }
                                            }
                                        }
                                    },
                                    0
                                ]
                            } // Match category ID within productCategory array
                        ]
                    }
                }
            }
        }
    }
}
export const offerBrandPopulation = (getOfferList: any, offerApplied: any) => {
    return {
        $addFields: {
            brandOffers: {
                $filter: {
                    input: getOfferList,
                    as: "offer",
                    cond: {
                        $and: [
                            { $in: ["$$offer._id", offerApplied.offerId] }, // Match offer ID
                            // { $in: ["$brand._id", offerApplied.brands] } // Match brand ID
                            {
                                $in: [
                                    "$brand._id",
                                    { $map: { input: "$$offer.offerApplyValues", as: "id", in: { $toObjectId: "$$id" } } }
                                ]
                            }
                        ]
                    }
                }
            }
        }
    }
}
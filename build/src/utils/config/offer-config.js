"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.offerBrandPopulation = exports.offerCategoryPopulation = exports.offerProductPopulation = void 0;
const offerProductPopulation = (getOfferList, offerApplied) => {
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
    };
    return pipeline;
};
exports.offerProductPopulation = offerProductPopulation;
const offerCategoryPopulation = (getOfferList, offerApplied) => {
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
    };
};
exports.offerCategoryPopulation = offerCategoryPopulation;
const offerBrandPopulation = (getOfferList, offerApplied) => {
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
    };
};
exports.offerBrandPopulation = offerBrandPopulation;

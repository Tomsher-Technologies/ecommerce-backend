"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewProductVariantLookup = exports.reviewCsutomerLookup = exports.reviewProductLookup = void 0;
const collections_1 = require("../../constants/collections");
exports.reviewProductLookup = [
    {
        $lookup: {
            from: `${collections_1.collections.ecommerce.products.products}`,
            localField: 'productId',
            foreignField: '_id',
            as: 'productDetails',
            pipeline: [
                {
                    $project: {
                        _id: 1,
                        starRating: 1,
                        productTitle: 1,
                        slug: 1
                    }
                }
            ]
        }
    },
    { $unwind: { path: '$productDetails', preserveNullAndEmptyArrays: true } },
];
exports.reviewCsutomerLookup = [
    {
        $lookup: {
            from: `${collections_1.collections.customer.customers}`,
            localField: 'customerId',
            foreignField: '_id',
            as: 'customer',
            pipeline: [
                {
                    $project: {
                        _id: 1,
                        customerCode: 1,
                        email: 1,
                        firstName: 1,
                        phone: 1,
                        guestPhone: 1,
                        guestEmail: 1,
                        referralCode: 1,
                    }
                }
            ]
        }
    },
    { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
];
exports.reviewProductVariantLookup = [
    {
        $lookup: {
            from: `${collections_1.collections.ecommerce.products.productvariants.productvariants}`,
            localField: 'variantId',
            foreignField: '_id',
            as: 'variantDetails',
            pipeline: [
                {
                    $project: {
                        _id: 1,
                        variantSku: 1,
                        slug: 1,
                        extraProductTitle: 1,
                    }
                }
            ]
        }
    },
    { $unwind: { path: '$variantDetails', preserveNullAndEmptyArrays: true } },
];

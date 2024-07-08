"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerDetailProject = exports.customerProject = exports.referredWalletTransactionLookup = exports.referrerWalletTransactionLookup = exports.orderWalletTransactionLookup = exports.billingLookup = exports.shippingLookup = exports.groupStage = exports.addField = exports.orderLookup = exports.countriesLookup = exports.whishlistLookup = void 0;
const collections_1 = require("../../constants/collections");
const wallet_1 = require("../../constants/wallet");
exports.whishlistLookup = {
    $lookup: {
        from: `${collections_1.collections.customer.wishlists}`,
        localField: '_id',
        foreignField: 'userId',
        as: 'whishlist'
    }
};
exports.countriesLookup = {
    $lookup: {
        from: `${collections_1.collections.setup.countries}`,
        localField: 'countryId',
        foreignField: '_id',
        as: 'country'
    }
};
exports.orderLookup = {
    $lookup: {
        from: `${collections_1.collections.cart.cartorders}`,
        let: { userId: '$_id' },
        pipeline: [
            { $match: { $expr: { $and: [{ $eq: ['$customerId', '$$userId'] }, { $ne: ['$cartStatus', '1'] }] } } }
        ],
        as: 'orders'
    }
};
exports.addField = {
    $addFields: {
        whishlistCount: { $size: '$whishlist' },
        orderCount: { $size: '$orders' },
        orderTotalAmount: {
            $sum: {
                $map: {
                    input: '$orders',
                    as: 'order',
                    in: '$$order.totalAmount'
                }
            }
        },
    },
};
exports.groupStage = {
    $group: {
        _id: '$_id',
    }
};
exports.shippingLookup = {
    $lookup: {
        from: 'customeraddresses',
        let: { userId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$customerId', '$$userId'] },
                            { $eq: ['$addressMode', 'shipping-address'] }
                        ]
                    }
                }
            }
        ],
        as: 'shippingAddress'
    }
};
exports.billingLookup = {
    $lookup: {
        from: 'customeraddresses',
        let: { userId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$customerId', '$$userId'] },
                            { $eq: ['$addressMode', 'billing-address'] }
                        ]
                    }
                }
            }
        ],
        as: 'billingAddress'
    }
};
exports.orderWalletTransactionLookup = {
    $lookup: {
        from: 'customerwallettransactions',
        let: { userId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$customerId', '$$userId'] },
                            { $eq: ['$earnType', wallet_1.earnTypes.order] }
                        ]
                    }
                }
            }
        ],
        as: 'orderWalletTransactions'
    }
};
exports.referrerWalletTransactionLookup = {
    $lookup: {
        from: 'customerwallettransactions',
        let: { userId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$customerId', '$$userId'] },
                            { $eq: ['$earnType', wallet_1.earnTypes.referrer] }
                        ]
                    }
                }
            }
        ],
        as: 'referrerWalletTransactions'
    }
};
exports.referredWalletTransactionLookup = {
    $lookup: {
        from: 'customerwallettransactions',
        let: { userId: '$_id' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$customerId', '$$userId'] },
                            { $eq: ['$earnType', wallet_1.earnTypes.referred] }
                        ]
                    }
                }
            }
        ],
        as: 'referredWalletTransactions'
    }
};
exports.customerProject = {
    $project: {
        _id: 1,
        countryId: 1,
        email: 1,
        firstName: 1,
        phone: 1,
        password: 1,
        customerImageUrl: 1,
        referralCode: 1,
        otp: 1,
        otpExpiry: 1,
        isVerified: 1,
        totalWalletAmount: 1,
        totalRewardPoint: 1,
        failureAttemptsCount: 1,
        resetPasswordCount: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
        __v: 1,
        whishlist: '$whishlistCount',
        totalOrderCount: '$orderCount',
        orderTotalAmount: 1,
    }
};
exports.customerDetailProject = {
    $project: {
        _id: 1,
        countryId: 1,
        email: 1,
        firstName: 1,
        phone: 1,
        password: 1,
        customerImageUrl: 1,
        referralCode: 1,
        otp: 1,
        otpExpiry: 1,
        isVerified: 1,
        totalWalletAmount: 1,
        totalRewardPoint: 1,
        failureAttemptsCount: 1,
        resetPasswordCount: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
        __v: 1,
        whishlist: '$whishlistCount',
        totalOrderCount: '$orderCount',
        orderTotalAmount: 1,
        shippingAddress: {
            $ifNull: ['$shippingAddress', []]
        },
        billingAddress: {
            $ifNull: ['$billingAddress', []]
        },
        referredWalletTransactions: {
            $ifNull: ['$referredWalletTransactions', []]
        },
        referrerWalletTransactions: {
            $ifNull: ['$referrerWalletTransactions', []]
        },
        orderWalletTransactions: {
            $ifNull: ['$orderWalletTransactions', []]
        },
        country: { $arrayElemAt: ['$country', 0] }
    }
};

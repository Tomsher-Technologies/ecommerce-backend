"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerDetailProject = exports.customerProject = exports.referredWalletTransactionLookup = exports.referrerWalletTransactionLookup = exports.orderWalletTransactionLookup = exports.addressLookup = exports.billingLookup = exports.shippingLookup = exports.groupStage = exports.addField = exports.reportOrderLookup = exports.orderLookup = exports.statesLookup = exports.countriesLookup = exports.whishlistLookup = void 0;
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
exports.statesLookup = {
    $lookup: {
        from: `${collections_1.collections.setup.states}`,
        localField: 'stateId',
        foreignField: '_id',
        as: 'state'
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
exports.reportOrderLookup = [{
        $lookup: {
            from: 'cartorders',
            let: { userId: '$_id' },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [
                                { $eq: ['$customerId', '$$userId'] },
                                { $ne: ['$cartStatus', '1'] }
                            ]
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        orderStatusAt: 1
                    }
                }
            ],
            as: 'orders'
        }
    },
    {
        $addFields: {
            lastOrderDate: {
                $arrayElemAt: ['$orders.orderStatusAt', -1]
            }
        }
    },
    {
        $project: {
            orders: 0
        }
    }];
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
        from: `${collections_1.collections.customer.customeraddresses}`,
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
        from: `${collections_1.collections.customer.customeraddresses}`,
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
exports.addressLookup = {
    $lookup: {
        from: `${collections_1.collections.customer.customeraddresses}`,
        localField: '_id',
        foreignField: 'customerId',
        as: 'address',
        pipeline: [{
                $project: {
                    _id: 1,
                    addressType: 1,
                    defaultAddress: 1,
                    addressMode: 1,
                    name: 1,
                    address1: 1,
                    address2: 1,
                    phoneNumber: 1,
                    landlineNumber: 1,
                    country: 1,
                    state: 1,
                    city: 1,
                    street: 1,
                    zipCode: 1,
                    longitude: 1,
                    latitude: 1,
                    isGuest: 1
                }
            }]
    }
};
exports.orderWalletTransactionLookup = {
    $lookup: {
        from: `${collections_1.collections.customer.customerwallettransactions}`,
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
        from: `${collections_1.collections.customer.customerwallettransactions}`,
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
        from: `${collections_1.collections.customer.customerwallettransactions}`,
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
